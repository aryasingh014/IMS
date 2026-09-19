import { Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/interns - Search, filter, and sort interns (scoped by role)
export async function getInterns(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { search, project, status, team, ftPotential, sortBy, sortOrder } = req.query;

    const conditions: any[] = [];

    // ponytail: strict role-based data isolation
    if (user?.role === 'TEAM_LEAD') {
      conditions.push({
        OR: [
          ...(user.teamId ? [{ teamId: user.teamId }] : []),
          { project: { projectLead: user.name } },
        ],
      });
    } else if (user?.role === 'INTERN') {
      conditions.push(user.internId ? { id: user.internId } : { email: user.email });
    }

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: String(search) } },
          { email: { contains: String(search) } },
          { module: { contains: String(search) } },
          { internId: { contains: String(search) } },
        ],
      });
    }

    if (project && project !== 'all') {
      conditions.push({ projectId: String(project) });
    }

    if (status && status !== 'all') {
      conditions.push({ status: String(status) });
    }

    if (team && team !== 'all') {
      conditions.push({ teamId: String(team) });
    }

    if (ftPotential && ftPotential !== 'all') {
      conditions.push({ ftPotential: String(ftPotential) });
    }

    const whereClause = conditions.length > 0 ? { AND: conditions } : {};

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
export async function getIdleInterns(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (user?.role === 'INTERN') {
      return res.status(403).json({ error: 'Access denied: Interns cannot access the idle intern directory' });
    }

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const conditions: any[] = [
      {
        OR: [
          { status: 'No Task' },
          { tasks: { none: { status: { in: ['Working', 'Waiting Review'] } } } },
          { dailyUpdates: { none: { date: { gte: twoDaysAgo } } } },
        ],
      },
    ];

    if (user?.role === 'TEAM_LEAD') {
      conditions.push({
        OR: [
          ...(user.teamId ? [{ teamId: user.teamId }] : []),
          { project: { projectLead: user.name } },
        ],
      });
    }

    const idleInterns = await prisma.intern.findMany({
      where: { AND: conditions },
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

// GET /api/interns/:id - Complete profile details + timeline (Query-level security isolation)
export async function getInternById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    const conditions: any[] = [{ id }];

    if (user?.role === 'INTERN') {
      conditions.push(user.internId ? { id: user.internId } : { email: user.email });
    } else if (user?.role === 'TEAM_LEAD') {
      conditions.push({
        OR: [
          ...(user.teamId ? [{ teamId: user.teamId }] : []),
          { project: { projectLead: user.name } },
        ],
      });
    }

    const isIntern = user?.role === 'INTERN';

    const intern = await prisma.intern.findFirst({
      where: { AND: conditions },
      include: {
        project: true,
        team: true,
        tasks: { orderBy: { createdAt: 'desc' } },
        dailyUpdates: { orderBy: { date: 'desc' } },
        blockers: { orderBy: { reportedDate: 'desc' } },
        // ponytail: prevent sensitive HR evaluations from being loaded into memory for interns
        ...(!isIntern
          ? {
              performanceReviews: { orderBy: { reviewDate: 'desc' } },
              ftEvaluations: { orderBy: { evaluationDate: 'desc' } },
            }
          : {}),
        whatsappMessages: { orderBy: { receivedAt: 'desc' } },
      },
    });

    if (!intern) {
      return res.status(404).json({ error: 'Intern not found or access denied.' });
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

// POST /api/interns - Create new intern (ADMIN only)
export async function createIntern(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, phone, module, projectId, teamId, remarks } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Intern name and email are required.' });
    }

    const existingEmail = await prisma.intern.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: `An intern with email "${email}" already exists.` });
    }

    if (projectId) {
      const proj = await prisma.project.findUnique({ where: { id: projectId } });
      if (!proj) return res.status(404).json({ error: 'Project not found.' });
    }

    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) return res.status(404).json({ error: 'Team not found.' });
    }

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

    await logAudit('Intern', intern.id, 'CREATE', req.user?.name || 'Admin', null, intern);
    return res.status(201).json({ intern });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create intern' });
  }
}

// PUT /api/interns/:id - Update intern profile & performance ratings
export async function updateIntern(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    const conditions: any[] = [{ id }];
    if (user?.role === 'TEAM_LEAD') {
      conditions.push({
        OR: [
          ...(user.teamId ? [{ teamId: user.teamId }] : []),
          { project: { projectLead: user.name } },
        ],
      });
    }

    const oldIntern = await prisma.intern.findFirst({
      where: { AND: conditions },
      include: { project: true },
    });

    if (!oldIntern) {
      return res.status(404).json({ error: 'Intern not found or access denied.' });
    }

    // Validate that TEAM_LEAD cannot reassign intern to another team outside their scope
    if (user?.role === 'TEAM_LEAD') {
      if (req.body.teamId && user.teamId && req.body.teamId !== user.teamId) {
        return res.status(403).json({ error: 'Forbidden: You cannot reassign an intern to another team.' });
      }
    }

    // Validate foreign keys if provided
    if (req.body.projectId) {
      const proj = await prisma.project.findUnique({ where: { id: req.body.projectId } });
      if (!proj) return res.status(404).json({ error: 'Project not found' });
    }
    if (req.body.teamId) {
      const team = await prisma.team.findUnique({ where: { id: req.body.teamId } });
      if (!team) return res.status(404).json({ error: 'Team not found' });
    }

    const intern = await prisma.intern.update({
      where: { id: oldIntern.id },
      data: {
        ...req.body,
        lastUpdated: new Date(),
      },
    });

    await logAudit('Intern', oldIntern.id, 'UPDATE', user?.name || 'Admin', oldIntern, intern);
    return res.json({ intern });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update intern' });
  }
}
