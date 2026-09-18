import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';

// GET /api/interns - Search, filter, and sort interns
export async function getInterns(req: Request, res: Response) {
  try {
    const { search, project, status, team, ftPotential, sortBy, sortOrder } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search) } },
        { email: { contains: String(search) } },
        { module: { contains: String(search) } },
        { internId: { contains: String(search) } },
      ];
    }

    if (project && project !== 'all') {
      whereClause.projectId = String(project);
    }

    if (status && status !== 'all') {
      whereClause.status = String(status);
    }

    if (team && team !== 'all') {
      whereClause.teamId = String(team);
    }

    if (ftPotential && ftPotential !== 'all') {
      whereClause.ftPotential = String(ftPotential);
    }

    let orderBy: any = { name: 'asc' };
    if (sortBy === 'lastUpdated') orderBy = { lastUpdated: sortOrder === 'asc' ? 'asc' : 'desc' };
    else if (sortBy === 'joiningDate') orderBy = { joiningDate: sortOrder === 'asc' ? 'asc' : 'desc' };
    else if (sortBy === 'learningSpeed') orderBy = { learningSpeed: sortOrder === 'asc' ? 'asc' : 'desc' };

    const interns = await prisma.intern.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        team: { select: { id: true, name: true, leadName: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy,
    });

    return res.json({ interns });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch interns' });
  }
}

// GET /api/interns/idle - Dedicated No Task / Idle Interns section
export async function getIdleInterns(req: Request, res: Response) {
  try {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const idleInterns = await prisma.intern.findMany({
      where: {
        OR: [
          { status: 'No Task' },
          { tasks: { none: { status: { in: ['Working', 'Waiting Review'] } } } },
          { dailyUpdates: { none: { date: { gte: twoDaysAgo } } } },
        ],
      },
      include: {
        project: { select: { name: true } },
        team: { select: { name: true, leadName: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 2,
        },
        dailyUpdates: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    return res.json({ idleInterns });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch idle interns' });
  }
}

// GET /api/interns/:id - Complete profile details + timeline
export async function getInternById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const intern = await prisma.intern.findUnique({
      where: { id },
      include: {
        project: true,
        team: true,
        tasks: { orderBy: { createdAt: 'desc' } },
        dailyUpdates: { orderBy: { date: 'desc' } },
        blockers: { orderBy: { reportedDate: 'desc' } },
        performanceReviews: { orderBy: { reviewDate: 'desc' } },
        ftEvaluations: { orderBy: { evaluationDate: 'desc' } },
        whatsappMessages: { orderBy: { receivedAt: 'desc' } },
      },
    });

    if (!intern) {
      return res.status(404).json({ error: 'Intern not found' });
    }

    // Assemble activity history timeline
    const timeline: Array<{ id: string; date: Date; type: string; title: string; description: string; tag?: string }> = [];

    intern.tasks.forEach((t) => {
      timeline.push({
        id: `task_${t.id}`,
        date: t.createdAt,
        type: 'TASK_ASSIGNED',
        title: `Task assigned: ${t.module || 'General'}`,
        description: t.description,
        tag: t.status,
      });
      if (t.completedDate) {
        timeline.push({
          id: `task_comp_${t.id}`,
          date: t.completedDate,
          type: 'TASK_COMPLETED',
          title: `Task completed: ${t.description.substring(0, 40)}`,
          description: `Progress: ${t.progress}% - ${t.notes || 'No notes'}`,
          tag: 'Completed',
        });
      }
    });

    intern.dailyUpdates.forEach((u) => {
      timeline.push({
        id: `update_${u.id}`,
        date: u.date,
        type: 'DAILY_UPDATE',
        title: `Daily Update submitted`,
        description: `Today: ${u.todayTask} | Completed: ${u.completedToday || 'N/A'}`,
        tag: 'Update',
      });
    });

    intern.blockers.forEach((b) => {
      timeline.push({
        id: `blocker_${b.id}`,
        date: b.reportedDate,
        type: 'BLOCKER',
        title: `Blocker reported: ${b.description.substring(0, 40)}`,
        description: `Status: ${b.status} | Assigned to: ${b.assignedTo || 'Unassigned'}`,
        tag: 'Blocker',
      });
    });

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({ intern, timeline });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch intern details' });
  }
}

// POST /api/interns - Create new intern
export async function createIntern(req: Request, res: Response) {
  try {
    const { name, email, phone, module, projectId, teamId, remarks } = req.body;

    const totalInterns = await prisma.intern.count();
    const internId = `INT-${1000 + totalInterns + 1}`;

    const intern = await prisma.intern.create({
      data: {
        internId,
        name,
        email,
        phone: phone || null,
        module: module || null,
        projectId: projectId || null,
        teamId: teamId || null,
        remarks: remarks || null,
        status: 'No Task',
      },
    });

    await logAudit('Intern', intern.id, 'CREATE', 'Admin', null, intern);
    return res.status(201).json({ intern });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create intern' });
  }
}

// PUT /api/interns/:id - Update intern profile & performance ratings
export async function updateIntern(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const oldIntern = await prisma.intern.findUnique({ where: { id } });

    if (!oldIntern) return res.status(404).json({ error: 'Intern not found' });

    const intern = await prisma.intern.update({
      where: { id },
      data: {
        ...req.body,
        lastUpdated: new Date(),
      },
    });

    await logAudit('Intern', id, 'UPDATE', 'Admin', oldIntern, intern);
    return res.json({ intern });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update intern' });
  }
}
