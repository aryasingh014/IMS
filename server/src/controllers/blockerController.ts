import { Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/blockers - List blockers (scoped by role)
export async function getBlockers(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { status } = req.query;
    const whereClause: any = {};

    if (user?.role === 'INTERN') {
      whereClause.intern = user.internId ? { id: user.internId } : { email: user.email };
    } else if (user?.role === 'TEAM_LEAD') {
      whereClause.intern = {
        OR: [
          { project: { projectLead: user.name } },
          ...(user.teamId ? [{ teamId: user.teamId }] : []),
        ],
      };
    }

    if (status && status !== 'all') {
      whereClause.status = String(status);
    } else if (!status) {
      whereClause.status = 'Open';
    }

    const blockers = await prisma.blocker.findMany({
      where: whereClause,
      include: {
        intern: {
          select: { id: true, name: true, email: true, project: { select: { id: true, name: true } } },
        },
        task: { select: { id: true, description: true, status: true } },
      },
      orderBy: { reportedDate: 'asc' },
    });

    return res.json({ blockers });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch blockers' });
  }
}

// POST /api/blockers - Create a new blocker
export async function createBlocker(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    let { internId, taskId, description, assignedTo } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Blocker description is required.' });
    }

    if (user?.role === 'INTERN') {
      let resolvedId = user.internId;
      if (!resolvedId) {
        const internRecord = await prisma.intern.findUnique({ where: { email: user.email } });
        resolvedId = internRecord?.id || null;
      }
      internId = resolvedId;
    }

    if (!internId) {
      return res.status(400).json({ error: 'Valid internId is required.' });
    }

    const targetIntern = await prisma.intern.findUnique({
      where: { id: internId },
      include: { project: true },
    });
    if (!targetIntern) {
      return res.status(404).json({ error: 'Intern not found' });
    }

    if (user?.role === 'TEAM_LEAD') {
      const isLead = (user.teamId && targetIntern.teamId === user.teamId) || (targetIntern.project?.projectLead === user.name);
      if (!isLead) {
        return res.status(403).json({ error: 'Forbidden: You can only report blockers for your own team members.' });
      }
    }

    if (taskId) {
      const targetTask = await prisma.task.findUnique({ where: { id: taskId } });
      if (!targetTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }

    const blocker = await prisma.blocker.create({
      data: {
        internId,
        taskId: taskId || null,
        description,
        assignedTo: assignedTo || null,
        reportedDate: new Date(),
        daysBlocked: 1,
        status: 'Open',
      },
    });

    await prisma.intern.update({
      where: { id: internId },
      data: { status: 'Blocked', lastUpdated: new Date() },
    });

    await logAudit('Blocker', blocker.id, 'CREATE', user?.name || 'User', null, blocker);
    return res.status(201).json({ blocker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create blocker' });
  }
}

// PUT /api/blockers/:id/resolve - Resolve blocker (ADMIN and TEAM_LEAD only)
export async function resolveBlocker(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user?.role === 'INTERN') {
      return res.status(403).json({ error: 'Forbidden: Interns cannot mark blockers as resolved.' });
    }

    const oldBlocker = await prisma.blocker.findUnique({
      where: { id },
      include: { intern: { include: { project: true } } },
    });
    if (!oldBlocker) return res.status(404).json({ error: 'Blocker not found' });

    if (user?.role === 'TEAM_LEAD') {
      const isLead = (user.teamId && oldBlocker.intern.teamId === user.teamId) || (oldBlocker.intern.project?.projectLead === user.name);
      if (!isLead) {
        return res.status(403).json({ error: 'Forbidden: You can only resolve blockers for your own team.' });
      }
    }

    const blocker = await prisma.blocker.update({
      where: { id },
      data: {
        status: 'Resolved',
        resolvedDate: new Date(),
      },
    });

    const openBlockersCount = await prisma.blocker.count({
      where: { internId: blocker.internId, status: 'Open' },
    });

    if (openBlockersCount === 0) {
      await prisma.intern.update({
        where: { id: blocker.internId },
        data: { status: 'Working', lastUpdated: new Date() },
      });
    }

    await logAudit('Blocker', id, 'UPDATE', user?.name || 'Admin', oldBlocker, blocker);
    return res.json({ blocker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to resolve blocker' });
  }
}
