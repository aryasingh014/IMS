import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';

// GET /api/teams - List all teams with leads and intern workload
export async function getTeams(req: Request, res: Response) {
  try {
    const teams = await prisma.team.findMany({
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

// POST /api/teams - Create team
export async function createTeam(req: Request, res: Response) {
  try {
    const { name, leadName, description } = req.body;

    const team = await prisma.team.create({
      data: { name, leadName, description },
    });

    await logAudit('Team', team.id, 'CREATE', 'Admin', null, team);
    return res.status(201).json({ team });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create team' });
  }
}
