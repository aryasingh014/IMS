import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';

// GET /api/blockers - List blockers sorted by duration
export async function getBlockers(req: Request, res: Response) {
  try {
    const { status } = req.query;
    const whereClause: any = {};

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
      orderBy: { reportedDate: 'asc' }, // Longest blocked first
    });

    return res.json({ blockers });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch blockers' });
  }
}

// POST /api/blockers - Create a new blocker
export async function createBlocker(req: Request, res: Response) {
  try {
    const { internId, taskId, description, assignedTo } = req.body;

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

    // Mark intern status as Blocked
    await prisma.intern.update({
      where: { id: internId },
      data: { status: 'Blocked', lastUpdated: new Date() },
    });

    await logAudit('Blocker', blocker.id, 'CREATE', 'Admin', null, blocker);
    return res.status(201).json({ blocker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create blocker' });
  }
}

// PUT /api/blockers/:id/resolve - Resolve blocker
export async function resolveBlocker(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const oldBlocker = await prisma.blocker.findUnique({ where: { id } });
    if (!oldBlocker) return res.status(404).json({ error: 'Blocker not found' });

    const blocker = await prisma.blocker.update({
      where: { id },
      data: {
        status: 'Resolved',
        resolvedDate: new Date(),
      },
    });

    // Check if intern has any other open blockers
    const openBlockersCount = await prisma.blocker.count({
      where: { internId: blocker.internId, status: 'Open' },
    });

    if (openBlockersCount === 0) {
      await prisma.intern.update({
        where: { id: blocker.internId },
        data: { status: 'Working', lastUpdated: new Date() },
      });
    }

    await logAudit('Blocker', id, 'UPDATE', 'Admin', oldBlocker, blocker);
    return res.json({ blocker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to resolve blocker' });
  }
}
