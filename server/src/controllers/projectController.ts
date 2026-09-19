import { Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/projects - All projects with statistics (scoped by role with Multi-Lead support)
export async function getProjects(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    let whereClause: any = {};

    // ponytail: include projects where user is primary lead, co-lead, or squad team member
    if (user?.role === 'TEAM_LEAD') {
      whereClause = {
        OR: [
          { projectLead: user.name },
          { coLeads: { contains: user.name } },
          ...(user.teamId ? [{ interns: { some: { teamId: user.teamId } } }] : []),
        ],
      };
    } else if (user?.role === 'INTERN') {
      whereClause = {
        interns: {
          some: user.internId ? { id: user.internId } : { email: user.email },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        interns: {
          select: {
            id: true,
            name: true,
            status: true,
            ftPotential: true,
            teamId: true,
            module: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            progress: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = projects.map((p) => {
      const totalInterns = p.interns.length;
      const activeCount = p.interns.filter((i) => i.status === 'Working').length;
      const blockedCount = p.interns.filter((i) => i.status === 'Blocked').length;
      const noTaskCount = p.interns.filter((i) => i.status === 'No Task').length;
      const completedTasks = p.tasks.filter((t) => t.status === 'Completed').length;
      const inProgressTasks = p.tasks.filter((t) => t.status === 'Working').length;
      const totalProg = p.tasks.reduce((acc, t) => acc + t.progress, 0);
      const avgProgress = p.tasks.length > 0 ? Math.round(totalProg / p.tasks.length) : 0;

      return {
        id: p.id,
        name: p.name,
        projectLead: p.projectLead,
        coLeads: p.coLeads || '',
        description: p.description,
        status: p.status,
        targetCompletion: p.targetCompletion,
        totalInterns,
        activeCount,
        blockedCount,
        noTaskCount,
        completedTasks,
        inProgressTasks,
        avgProgress,
        interns: p.interns,
      };
    });

    return res.json({ projects: formatted });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
}

// GET /api/projects/:id - Detailed project page with squad & co-leads
export async function getProjectById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        interns: {
          include: {
            team: true,
            tasks: { orderBy: { createdAt: 'desc' }, take: 1 },
            dailyUpdates: { orderBy: { date: 'desc' }, take: 1 },
          },
        },
        tasks: {
          include: {
            intern: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (user?.role === 'TEAM_LEAD') {
      const isLead =
        project.projectLead === user.name ||
        (project.coLeads && project.coLeads.includes(user.name)) ||
        (user.teamId && project.interns.some((i) => i.teamId === user.teamId));

      if (!isLead) {
        return res.status(403).json({ error: 'Forbidden: You do not lead this project or have team members in it.' });
      }
    }

    if (user?.role === 'INTERN') {
      const isAssigned = project.interns.some((i) => i.id === user.internId || i.email === user.email);
      if (!isAssigned) {
        return res.status(403).json({ error: 'Forbidden: You are not assigned to this project.' });
      }
    }

    return res.json({ project });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch project detail' });
  }
}

// POST /api/projects - Create project with Co-Leads & Squad Intern selection (ADMIN & TEAM_LEAD)
export async function createProject(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { name, projectLead, coLeads, description, targetCompletion, internIds } = req.body;

    // Default project lead to logged in user if Team Lead
    const lead = projectLead || user?.name || 'Admin Team Lead';
    const coLeadsStr = Array.isArray(coLeads) ? coLeads.join(', ') : coLeads || '';

    const project = await prisma.project.create({
      data: {
        name,
        projectLead: lead,
        coLeads: coLeadsStr,
        description,
        targetCompletion: targetCompletion ? parseInt(targetCompletion, 10) : 100,
      },
    });

    // ponytail: batch associate selected squad interns to newly created project
    if (Array.isArray(internIds) && internIds.length > 0) {
      await prisma.intern.updateMany({
        where: { id: { in: internIds } },
        data: { projectId: project.id },
      });
    }

    await logAudit('Project', project.id, 'CREATE', user?.name || 'Admin', null, {
      ...project,
      assignedInternsCount: internIds?.length || 0,
    });

    return res.status(201).json({ project });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create project' });
  }
}

// PUT /api/projects/:id - Update project, co-leads & squad roster (ADMIN & TEAM_LEAD)
export async function updateProject(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    const oldVal = await prisma.project.findUnique({ where: { id }, include: { interns: true } });

    if (!oldVal) return res.status(404).json({ error: 'Project not found' });

    // Verify update rights for TEAM_LEAD
    if (user?.role === 'TEAM_LEAD') {
      const isLead =
        oldVal.projectLead === user.name ||
        (oldVal.coLeads && oldVal.coLeads.includes(user.name));
      if (!isLead) {
        return res.status(403).json({ error: 'Forbidden: Only assigned leads can edit this project.' });
      }
    }

    const { internIds, coLeads, ...restData } = req.body;
    const updateData: any = { ...restData };

    if (coLeads !== undefined) {
      updateData.coLeads = Array.isArray(coLeads) ? coLeads.join(', ') : coLeads;
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // If internIds is provided, update roster
    if (Array.isArray(internIds)) {
      // Unlink interns not in the list
      await prisma.intern.updateMany({
        where: { projectId: id, id: { notIn: internIds } },
        data: { projectId: null },
      });
      // Link selected interns
      if (internIds.length > 0) {
        await prisma.intern.updateMany({
          where: { id: { in: internIds } },
          data: { projectId: id },
        });
      }
    }

    await logAudit('Project', id, 'UPDATE', user?.name || 'Admin', oldVal, project);
    return res.json({ project });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update project' });
  }
}
