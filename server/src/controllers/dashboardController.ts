import { Response } from 'express';
import { prisma } from '../db.js';
import { refreshAlerts } from '../services/alertService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getDashboardSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ponytail: build dynamic scoping filter based on auth role
    let internWhere: any = {};
    let projectWhere: any = {};
    let taskWhere: any = {};

    if (user?.role === 'TEAM_LEAD') {
      internWhere = {
        OR: [
          ...(user.teamId ? [{ teamId: user.teamId }] : []),
          { project: { projectLead: user.name } },
        ],
      };
      projectWhere = {
        OR: [
          { projectLead: user.name },
          ...(user.teamId ? [{ interns: { some: { teamId: user.teamId } } }] : []),
        ],
      };
      taskWhere = {
        intern: internWhere,
      };
    } else if (user?.role === 'INTERN') {
      const internIdFilter = user.internId ? { id: user.internId } : { email: user.email };
      const resolvedIntern = await prisma.intern.findFirst({ where: internIdFilter });
      
      // Explicit handling when no intern record is linked
      if (!resolvedIntern) {
        return res.json({
          kpi: {
            totalInterns: 0,
            activeInterns: 0,
            blockedInterns: 0,
            idleInterns: 0,
            completedTasksToday: 0,
            projectsCount: 0,
            ftPotentialCount: 0,
            tasksDueToday: 0,
          },
          projectSummary: [],
          statusBoard: { WORKING: [], BLOCKED: [], NO_TASK: [], WAITING_REVIEW: [], COMPLETED: [] },
          charts: {
            internsByProject: [],
            taskStatusDistribution: [],
            weeklyCompletion: [],
            blockersByProject: [],
          },
          recentUpdates: [],
          alerts: [],
        });
      }

      const internDbId = resolvedIntern.id;
      internWhere = { id: internDbId };
      projectWhere = resolvedIntern.projectId ? { id: resolvedIntern.projectId } : { id: resolvedIntern.id };
      taskWhere = { internId: internDbId };
    }

    // Refresh alerts only for the active role scope
    await refreshAlerts(internWhere);

    // 1. Intern Counts (scoped)
    const totalInterns = await prisma.intern.count({ where: internWhere });
    const activeInterns = await prisma.intern.count({ where: { ...internWhere, status: 'Working' } });
    const blockedInterns = await prisma.intern.count({ where: { ...internWhere, status: 'Blocked' } });
    const idleInterns = await prisma.intern.count({
      where: {
        ...internWhere,
        OR: [
          { status: 'No Task' },
          { tasks: { none: { status: { in: ['Working', 'Waiting Review'] } } } },
        ],
      },
    });

    const completedTasksToday = await prisma.task.count({
      where: {
        ...taskWhere,
        status: 'Completed',
        completedDate: { gte: startOfToday },
      },
    });

    const projectsCount = await prisma.project.count({ where: projectWhere });
    const ftPotentialCount = await prisma.intern.count({
      where: { ...internWhere, ftPotential: 'Strong Potential' },
    });

    const tasksDueToday = await prisma.task.count({
      where: {
        ...taskWhere,
        status: { in: ['Working', 'Waiting Review', 'Not Started'] },
        deadline: {
          gte: startOfToday,
          lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    // 2. Fetch Projects Summary (scoped)
    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        interns: { where: internWhere },
        tasks: { where: taskWhere },
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

    // 3. Fetch Intern Status Board (Kanban cards - scoped)
    const internsWithDetails = await prisma.intern.findMany({
      where: internWhere,
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
    const internsByProject = projectSummary.map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      fullName: p.name,
      count: p.internCount,
      active: p.activeCount,
      blocked: p.blockedCount,
    }));

    const taskStatuses = await prisma.task.groupBy({
      by: ['status'],
      where: taskWhere,
      _count: { _all: true },
    });
    const taskStatusDistribution = taskStatuses.map((t) => ({
      name: t.status,
      value: t._count._all,
    }));

    const blockersByProject = projectSummary.map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      blocked: p.blockedCount,
    }));

    // Dynamic 5-day task completion history
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyCompletion = [];
    for (let offset = 4; offset >= 0; offset--) {
      const dayStart = new Date(startOfToday.getTime() - offset * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayName = daysOfWeek[dayStart.getDay()];

      const completed = await prisma.task.count({
        where: {
          ...taskWhere,
          status: 'Completed',
          completedDate: { gte: dayStart, lt: dayEnd },
        },
      });

      const assigned = await prisma.task.count({
        where: {
          ...taskWhere,
          startDate: { gte: dayStart, lt: dayEnd },
        },
      });

      weeklyCompletion.push({
        day: dayName,
        completed,
        assigned: Math.max(assigned, completed),
      });
    }

    // 5. Recent Daily Updates (scoped)
    const recentUpdates = await prisma.dailyUpdate.findMany({
      where: { intern: internWhere },
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        intern: {
          select: { name: true, email: true, project: { select: { name: true } } },
        },
      },
    });

    // 6. Active Alerts (scoped)
    const alerts = await prisma.alert.findMany({
      where: {
        OR: [
          { intern: internWhere },
          { project: projectWhere },
        ],
      },
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
