import { Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/tasks - Fetch tasks with filters (scoped by role)
export async function getTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { search, project, status, internId, priority } = req.query;

    const conditions: any[] = [];

    // ponytail: strict role-based task scoping
    if (user?.role === 'TEAM_LEAD') {
      conditions.push({
        OR: [
          { project: { projectLead: user.name } },
          ...(user.teamId ? [{ intern: { teamId: user.teamId } }] : []),
        ],
      });
    } else if (user?.role === 'INTERN') {
      conditions.push({
        intern: user.internId ? { id: user.internId } : { email: user.email },
      });
    }

    if (search) {
      conditions.push({
        OR: [
          { description: { contains: String(search) } },
          { module: { contains: String(search) } },
          { taskId: { contains: String(search) } },
          { intern: { name: { contains: String(search) } } },
        ],
      });
    }

    if (project && project !== 'all') conditions.push({ projectId: String(project) });
    if (status && status !== 'all') conditions.push({ status: String(status) });
    if (internId) {
      if (user?.role === 'INTERN' && user.internId && user.internId !== internId) {
        return res.status(403).json({ error: 'Forbidden: You can only query your own tasks.' });
      }
      conditions.push({ internId: String(internId) });
    }
    if (priority && priority !== 'all') conditions.push({ priority: String(priority) });

    const whereClause = conditions.length > 0 ? { AND: conditions } : {};

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        intern: { select: { id: true, name: true, email: true, status: true } },
        project: { select: { id: true, name: true, projectLead: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ tasks });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch tasks' });
  }
}

// POST /api/tasks - Create/Assign new task
export async function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (user?.role === 'INTERN') {
      return res.status(403).json({ error: 'Forbidden: Interns cannot create tasks.' });
    }

    const { internId, projectId, description, module, priority, startDate, deadline, reviewer, notes } = req.body;

    if (!internId || !projectId || !description) {
      return res.status(400).json({ error: 'internId, projectId, and description are required.' });
    }

    const targetIntern = await prisma.intern.findUnique({
      where: { id: internId },
      include: { project: true },
    });
    if (!targetIntern) {
      return res.status(404).json({ error: 'Intern not found' });
    }

    const targetProject = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!targetProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (user?.role === 'TEAM_LEAD') {
      const isLead = (user.teamId && targetIntern.teamId === user.teamId) || (targetIntern.project?.projectLead === user.name);
      if (!isLead) {
        return res.status(403).json({ error: 'Forbidden: You can only assign tasks to your own team members.' });
      }
    }

    const totalTasks = await prisma.task.count();
    const taskId = `TSK-${2000 + totalTasks + 1}`;

    const task = await prisma.task.create({
      data: {
        taskId,
        description,
        module: module || null,
        priority: priority || 'Medium',
        startDate: startDate ? new Date(startDate) : new Date(),
        deadline: deadline ? new Date(deadline) : null,
        reviewer: reviewer || user?.name || null,
        notes: notes || null,
        status: 'Working',
        progress: 0,
        internId,
        projectId,
      },
    });

    await prisma.intern.update({
      where: { id: internId },
      data: {
        status: 'Working',
        lastUpdated: new Date(),
      },
    });

    await logAudit('Task', task.id, 'CREATE', user?.name || 'Admin', null, task);
    return res.status(201).json({ task });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create task' });
  }
}

// PUT /api/tasks/:id - Edit, reassign, or update task progress/status
export async function updateTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    const oldTask = await prisma.task.findUnique({
      where: { id },
      include: { intern: true, project: true },
    });

    if (!oldTask) return res.status(404).json({ error: 'Task not found' });

    let allowedFields: any = { ...req.body };

    if (user?.role === 'INTERN') {
      const isOwnTask = oldTask.internId === user.internId || oldTask.intern.email === user.email;
      if (!isOwnTask) {
        return res.status(403).json({ error: 'Forbidden: You cannot modify tasks assigned to other interns.' });
      }
      // Interns can only update progress, notes, and task status
      allowedFields = {
        status: req.body.status,
        progress: req.body.progress !== undefined ? parseInt(req.body.progress, 10) : undefined,
        notes: req.body.notes,
      };
    } else if (user?.role === 'TEAM_LEAD') {
      const isLead = (user.teamId && oldTask.intern.teamId === user.teamId) || (oldTask.project.projectLead === user.name);
      if (!isLead) {
        return res.status(403).json({ error: 'Forbidden: You cannot modify tasks outside your squad.' });
      }
    }

    // If reassignment is attempted, validate new intern exists and is within scope if TEAM_LEAD
    if (allowedFields.internId && allowedFields.internId !== oldTask.internId) {
      const newIntern = await prisma.intern.findUnique({
        where: { id: allowedFields.internId },
        include: { project: true },
      });
      if (!newIntern) {
        return res.status(404).json({ error: 'Target intern not found' });
      }
      if (user?.role === 'TEAM_LEAD') {
        const isNewInternInScope = (user.teamId && newIntern.teamId === user.teamId) || (newIntern.project?.projectLead === user.name);
        if (!isNewInternInScope) {
          return res.status(403).json({ error: 'Forbidden: You cannot reassign tasks to interns outside your squad.' });
        }
      }
    }

    if (allowedFields.status === 'Completed' && oldTask.status !== 'Completed') {
      allowedFields.completedDate = new Date();
      allowedFields.progress = 100;
    }

    const task = await prisma.task.update({
      where: { id },
      data: allowedFields,
    });

    if (allowedFields.status) {
      const activeTasksCount = await prisma.task.count({
        where: {
          internId: task.internId,
          status: { in: ['Working', 'Waiting Review', 'Blocked'] },
        },
      });

      let newInternStatus = 'Working';
      if (allowedFields.status === 'Blocked') newInternStatus = 'Blocked';
      else if (allowedFields.status === 'Waiting Review') newInternStatus = 'Waiting Review';
      else if (activeTasksCount === 0) newInternStatus = 'No Task';

      await prisma.intern.update({
        where: { id: task.internId },
        data: { status: newInternStatus, lastUpdated: new Date() },
      });
    }

    await logAudit('Task', id, 'UPDATE', user?.name || 'Admin', oldTask, task);
    return res.json({ task });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update task' });
  }
}

// DELETE /api/tasks/:id (ADMIN only)
export async function deleteTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const taskToDelete = await prisma.task.findUnique({
      where: { id },
      include: { intern: true, project: true },
    });
    if (!taskToDelete) return res.status(404).json({ error: 'Task not found' });

    await prisma.task.delete({ where: { id } });
    await logAudit('Task', id, 'DELETE', req.user?.name || 'Admin', taskToDelete, null);
    return res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
}
