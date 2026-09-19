import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/updates - Daily updates list with date filters (scoped by role)
export async function getDailyUpdates(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { internId, range, startDate, endDate } = req.query;

    const conditions: any[] = [];

    // ponytail: role-scoped daily updates
    if (user?.role === 'INTERN') {
      conditions.push({
        intern: user.internId ? { id: user.internId } : { email: user.email },
      });
    } else if (user?.role === 'TEAM_LEAD') {
      conditions.push({
        intern: {
          OR: [
            { project: { projectLead: user.name } },
            ...(user.teamId ? [{ teamId: user.teamId }] : []),
          ],
        },
      });
    }

    if (internId) {
      if (user?.role === 'INTERN' && user.internId && user.internId !== internId) {
        return res.status(403).json({ error: 'Forbidden: You can only query your own updates.' });
      }
      conditions.push({ internId: String(internId) });
    }

    const now = new Date();
    if (range === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      conditions.push({ date: { gte: startOfDay } });
    } else if (range === 'yesterday') {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      conditions.push({ date: { gte: startOfYesterday, lt: endOfYesterday } });
    } else if (range === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      conditions.push({ date: { gte: sevenDaysAgo } });
    } else if (startDate && endDate) {
      conditions.push({
        date: {
          gte: new Date(String(startDate)),
          lte: new Date(String(endDate)),
        },
      });
    }

    const updates = await prisma.dailyUpdate.findMany({
      where: conditions.length > 0 ? { AND: conditions } : {},
      include: {
        intern: {
          select: { id: true, name: true, email: true, project: { select: { name: true } } },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.json({ updates });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch daily updates' });
  }
}

// POST /api/updates - Submit daily update (Strict ownership & scope validation)
export async function submitDailyUpdate(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { internId, todayTask, completedToday, pending, blocker, tomorrowTask, notes } = req.body;

    if (!todayTask) {
      return res.status(400).json({ error: 'Today task description is required.' });
    }

    let targetInternId = internId;

    if (user?.role === 'INTERN') {
      let resolvedId = user.internId;
      if (!resolvedId) {
        const internRecord = await prisma.intern.findUnique({ where: { email: user.email } });
        resolvedId = internRecord?.id || null;
      }
      if (!resolvedId) {
        return res.status(404).json({ error: 'No matching intern profile linked to your user account.' });
      }
      targetInternId = resolvedId;
    } else {
      if (!targetInternId) {
        return res.status(400).json({ error: 'internId is required when submitting as Admin/Team Lead.' });
      }
    }

    const targetIntern = await prisma.intern.findUnique({
      where: { id: targetInternId },
      include: { project: true },
    });

    if (!targetIntern) {
      return res.status(404).json({ error: 'Target intern not found.' });
    }

    if (user?.role === 'TEAM_LEAD') {
      const isLead = (user.teamId && targetIntern.teamId === user.teamId) || (targetIntern.project?.projectLead === user.name);
      if (!isLead) {
        return res.status(403).json({ error: 'Forbidden: You can only submit updates for your assigned team members.' });
      }
    }

    const update = await prisma.dailyUpdate.create({
      data: {
        internId: targetInternId,
        todayTask,
        completedToday: completedToday || null,
        pending: pending || null,
        blocker: blocker || null,
        tomorrowTask: tomorrowTask || null,
        notes: notes || null,
        date: new Date(),
      },
    });

    await prisma.intern.update({
      where: { id: targetInternId },
      data: { lastUpdated: new Date() },
    });

    return res.status(201).json({ update });
  } catch (error: any) {
    console.error('submitDailyUpdate Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit daily update' });
  }
}
