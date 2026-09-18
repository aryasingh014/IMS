import { Request, Response } from 'express';
import { prisma } from '../db.js';

// GET /api/alerts - Active alerts list
export async function getAlerts(req: Request, res: Response) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { isAcknowledged: false },
      include: {
        intern: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ alerts });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch alerts' });
  }
}

// PUT /api/alerts/:id/acknowledge - Dismiss/acknowledge an alert
export async function acknowledgeAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const alert = await prisma.alert.update({
      where: { id },
      data: { isAcknowledged: true },
    });
    return res.json({ alert });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to acknowledge alert' });
  }
}
