import { Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/teams - List teams (scoped by role)
export async function getTeams(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    let whereClause: any = {};

    if (user?.role === 'TEAM_LEAD') {
      whereClause = {
        OR: [
          { leadName: user.name },
          ...(user.teamId ? [{ id: user.teamId }] : []),
        ],
      };
    } else if (user?.role === 'INTERN') {
      whereClause = {
        interns: {
          some: user.internId ? { id: user.internId } : { email: user.email },
        },
      };
    }

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        interns: {
          select: {
            id: true,
            name: true,
            status: true,
            project: { select: { name: true } },
          },
        },
      },
    });

    const formatted = teams.map((t) => {
      const totalInterns = t.interns.length;
      const working = t.interns.filter((i) => i.status === 'Working').length;
      const blocked = t.interns.filter((i) => i.status === 'Blocked').length;
      const noTask = t.interns.filter((i) => i.status === 'No Task').length;

      return {
        id: t.id,
        name: t.name,
        leadName: t.leadName,
        description: t.description,
        totalInterns,
        working,
        blocked,
        noTask,
        interns: t.interns,
      };
    });

    return res.json({ teams: formatted });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch teams' });
  }
}

// POST /api/teams - Create team (ADMIN only)
export async function createTeam(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, leadName, description } = req.body;

    const team = await prisma.team.create({
      data: { name, leadName, description },
    });

    await logAudit('Team', team.id, 'CREATE', req.user?.name || 'Admin', null, team);
    return res.status(201).json({ team });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create team' });
  }
}
