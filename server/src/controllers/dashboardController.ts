import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { refreshAlerts } from '../services/alertService.js';

export async function getDashboardSummary(req: Request, res: Response) {
  try {
    // Refresh alerts to reflect latest system state
    await refreshAlerts();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Fetch Intern Counts
    const totalInterns = await prisma.intern.count();
    const activeInterns = await prisma.intern.count({ where: { status: 'Working' } });
    const blockedInterns = await prisma.intern.count({ where: { status: 'Blocked' } });
    const idleInterns = await prisma.intern.count({
      where: {
        OR: [
          { status: 'No Task' },
          { tasks: { none: { status: { in: ['Working', 'Waiting Review'] } } } },
        ],
      },
    });
    const completedTasksToday = await prisma.task.count({
      where: {
        status: 'Completed',
        completedDate: { gte: startOfToday },
      },
    });
    const projectsCount = await prisma.project.count();
    const ftPotentialCount = await prisma.intern.count({
      where: { ftPotential: 'Strong Potential' },
    });
    const tasksDueToday = await prisma.task.count({
      where: {
        status: { in: ['Working', 'Waiting Review', 'Not Started'] },
        deadline: {
          gte: startOfToday,
          lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    // 2. Fetch Projects Summary
    const projects = await prisma.project.findMany({
      include: {
        interns: true,
        tasks: true,
      },
    });

    const projectSummary = projects.map((p) => {
      const total = p.interns.length;
      const active = p.interns.filter((i) => i.status === 'Working').length;
      const blocked = p.interns.filter((i) => i.status === 'Blocked').length;
      const completedTasks = p.tasks.filter((t) => t.status === 'Completed').length;
      const totalProgress = p.tasks.reduce((acc, curr) => acc + curr.progress, 0);
      const avgProgress = p.tasks.length > 0 ? Math.round(totalProgress / p.tasks.length) : 0;

      return {
        id: p.id,
        name: p.name,
        projectLead: p.projectLead,
        internCount: total,
        activeCount: active,
        blockedCount: blocked,
        completedTasks,
        avgProgress,
      };
    });

    // 3. Fetch Intern Status Board (Kanban cards)
    const internsWithDetails = await prisma.intern.findMany({
      include: {
        project: { select: { name: true } },
        tasks: {
          where: { status: { in: ['Working', 'Waiting Review', 'Blocked', 'Not Started'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    const statusBoard = {
      WORKING: internsWithDetails.filter((i) => i.status === 'Working'),
      BLOCKED: internsWithDetails.filter((i) => i.status === 'Blocked'),
      NO_TASK: internsWithDetails.filter((i) => i.status === 'No Task' || i.tasks.length === 0),
      WAITING_REVIEW: internsWithDetails.filter((i) => i.status === 'Waiting Review'),
      COMPLETED: internsWithDetails.filter((i) => i.status === 'Completed'),
    };

    // 4. Recharts Chart Datasets
    // Interns by Project
    const internsByProject = projectSummary.map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      fullName: p.name,
      count: p.internCount,
      active: p.activeCount,
      blocked: p.blockedCount,
    }));

    // Task Status Distribution
    const taskStatuses = await prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const taskStatusDistribution = taskStatuses.map((t) => ({
      name: t.status,
      value: t._count._all,
    }));

    // Blockers by Project
    const blockersByProject = projectSummary.map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      blocked: p.blockedCount,
    }));

    // Weekly Completion sample data
    const weeklyCompletion = [
      { day: 'Mon', completed: 12, assigned: 15 },
      { day: 'Tue', completed: 18, assigned: 20 },
      { day: 'Wed', completed: 14, assigned: 18 },
      { day: 'Thu', completed: 22, assigned: 24 },
      { day: 'Fri', completed: 25, assigned: 28 },
    ];

    // 5. Recent Daily Updates
    const recentUpdates = await prisma.dailyUpdate.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        intern: {
          select: { name: true, email: true, project: { select: { name: true } } },
        },
      },
    });

    // 6. Active Alerts
    const alerts = await prisma.alert.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        intern: { select: { name: true } },
      },
    });

    return res.json({
      kpi: {
        totalInterns,
        activeInterns,
        blockedInterns,
        idleInterns,
        completedTasksToday,
        projectsCount,
        ftPotentialCount,
        tasksDueToday,
      },
      projectSummary,
      statusBoard,
      charts: {
        internsByProject,
        taskStatusDistribution,
        weeklyCompletion,
        blockersByProject,
      },
      recentUpdates,
      alerts,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch dashboard summary' });
  }
}
