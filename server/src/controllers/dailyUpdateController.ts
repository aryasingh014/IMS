import { Request, Response } from 'express';
import { prisma } from '../db.js';

// GET /api/updates - Daily updates list with date filters
export async function getDailyUpdates(req: Request, res: Response) {
  try {
    const { internId, range, startDate, endDate } = req.query;

    const whereClause: any = {};
    if (internId) whereClause.internId = String(internId);

    const now = new Date();
    if (range === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      whereClause.date = { gte: startOfDay };
    } else if (range === 'yesterday') {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      whereClause.date = { gte: startOfYesterday, lt: endOfYesterday };
    } else if (range === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      whereClause.date = { gte: sevenDaysAgo };
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate)),
      };
    }

    const updates = await prisma.dailyUpdate.findMany({
      where: whereClause,
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

// POST /api/updates - Submit daily update
export async function submitDailyUpdate(req: Request, res: Response) {
  try {
    const { internId, todayTask, completedToday, pending, blocker, tomorrowTask, notes } = req.body;

    let validInternId = internId;
    if (validInternId) {
      const existing = await prisma.intern.findUnique({ where: { id: validInternId } });
      if (!existing) {
        const fallback = await prisma.intern.findFirst();
        if (fallback) validInternId = fallback.id;
      }
    } else {
      const fallback = await prisma.intern.findFirst();
      if (fallback) validInternId = fallback.id;
    }

    if (!validInternId) {
      return res.status(400).json({ error: 'No intern account found to attach daily update' });
    }

    const update = await prisma.dailyUpdate.create({
      data: {
        internId: validInternId,
        todayTask,
        completedToday: completedToday || null,
        pending: pending || null,
        blocker: blocker || null,
        tomorrowTask: tomorrowTask || null,
        notes: notes || null,
        date: new Date(),
      },
    });

    // Update intern last updated date
    await prisma.intern.update({
      where: { id: validInternId },
      data: { lastUpdated: new Date() },
    });

    return res.status(201).json({ update });
  } catch (error: any) {
    console.error('submitDailyUpdate Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit daily update' });
  }
}

