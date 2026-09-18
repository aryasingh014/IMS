import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';

// GET /api/tasks - Fetch tasks with filters
export async function getTasks(req: Request, res: Response) {
  try {
    const { search, project, status, internId, priority } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { description: { contains: String(search) } },
        { module: { contains: String(search) } },
        { taskId: { contains: String(search) } },
        { intern: { name: { contains: String(search) } } },
      ];
    }

    if (project && project !== 'all') whereClause.projectId = String(project);
    if (status && status !== 'all') whereClause.status = String(status);
    if (internId) whereClause.internId = String(internId);
    if (priority && priority !== 'all') whereClause.priority = String(priority);

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
export async function createTask(req: Request, res: Response) {
  try {
    const { internId, projectId, description, module, priority, startDate, deadline, reviewer, notes } = req.body;

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
        reviewer: reviewer || null,
        notes: notes || null,
        status: 'Working',
        progress: 0,
        internId,
        projectId,
      },
    });

    // Update intern status to Working if currently No Task
    await prisma.intern.update({
      where: { id: internId },
      data: {
        status: 'Working',
        lastUpdated: new Date(),
      },
    });

    await logAudit('Task', task.id, 'CREATE', 'Admin', null, task);
    return res.status(201).json({ task });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create task' });
  }
}

// PUT /api/tasks/:id - Edit, reassign, or update task progress/status
export async function updateTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const oldTask = await prisma.task.findUnique({ where: { id } });

    if (!oldTask) return res.status(404).json({ error: 'Task not found' });

    const updateData = { ...req.body };

    // Auto update completedDate if status changes to Completed
    if (updateData.status === 'Completed' && oldTask.status !== 'Completed') {
      updateData.completedDate = new Date();
      updateData.progress = 100;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    // Sync intern status with task status
    if (updateData.status) {
      const activeTasksCount = await prisma.task.count({
        where: {
          internId: task.internId,
          status: { in: ['Working', 'Waiting Review', 'Blocked'] },
        },
      });

      let newInternStatus = 'Working';
      if (updateData.status === 'Blocked') newInternStatus = 'Blocked';
      else if (updateData.status === 'Waiting Review') newInternStatus = 'Waiting Review';
      else if (activeTasksCount === 0) newInternStatus = 'No Task';

      await prisma.intern.update({
        where: { id: task.internId },
        data: { status: newInternStatus, lastUpdated: new Date() },
      });
    }

    await logAudit('Task', id, 'UPDATE', 'Admin', oldTask, task);
    return res.json({ task });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update task' });
  }
}

// DELETE /api/tasks/:id
export async function deleteTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const task = await prisma.task.delete({ where: { id } });

    await logAudit('Task', id, 'DELETE', 'Admin', task, null);
    return res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
}
