import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/alerts - Active alerts list (scoped by role)
export async function getAlerts(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    let whereClause: any = { isAcknowledged: false };

    if (user?.role === 'INTERN') {
      whereClause.intern = user.internId ? { id: user.internId } : { email: user.email };
    } else if (user?.role === 'TEAM_LEAD') {
      whereClause.OR = [
        { project: { projectLead: user.name } },
        ...(user.teamId ? [{ intern: { teamId: user.teamId } }] : []),
      ];
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
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
export async function acknowledgeAlert(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    const existingAlert = await prisma.alert.findUnique({
      where: { id },
      include: { intern: true, project: true },
    });

    if (!existingAlert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (user?.role === 'INTERN') {
      const isOwn = existingAlert.internId === user.internId || existingAlert.intern?.email === user.email;
      if (!isOwn) {
        return res.status(403).json({ error: 'Forbidden: You can only acknowledge alerts related to your own tasks.' });
      }
    } else if (user?.role === 'TEAM_LEAD') {
      const isOwnTeam = (user.teamId && existingAlert.intern?.teamId === user.teamId) || (existingAlert.project?.projectLead === user.name);
      if (!isOwnTeam) {
        return res.status(403).json({ error: 'Forbidden: You can only acknowledge alerts for your own squad.' });
      }
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: { isAcknowledged: true },
    });
    return res.json({ alert });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to acknowledge alert' });
  }
}
