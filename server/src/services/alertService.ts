import { prisma } from '../db.js';

// In-memory throttling cache to prevent redundant alert calculations on rapid dashboard loads
const lastRefreshMap = new Map<string, number>();

// ponytail: role-scoped throttled alert generation (max once every 30s per scope)
export async function refreshAlerts(internWhere: any = {}) {
  try {
    const scopeKey = JSON.stringify(internWhere || {});
    const nowMs = Date.now();
    const lastRefresh = lastRefreshMap.get(scopeKey) || 0;

    // Skip regeneration if refreshed recently
    if (nowMs - lastRefresh < 30000) {
      return;
    }
    lastRefreshMap.set(scopeKey, nowMs);

    const hasScope = internWhere && Object.keys(internWhere).length > 0;

    await prisma.alert.deleteMany({
      where: {
        isAcknowledged: false,
        ...(hasScope ? { intern: internWhere } : {}),
      },
    });

    const now = new Date();

    // 1. Detect Idle, Blocked, and Missing Updates (scoped)
    const interns = await prisma.intern.findMany({
      where: internWhere,
      include: {
        tasks: {
          where: { status: { in: ['Working', 'Waiting Review'] } },
        },
        dailyUpdates: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        blockers: {
          where: { status: 'Open' },
        },
        project: true,
      },
    });

    for (const intern of interns) {
      // Idle detection
      if (intern.status === 'No Task' || intern.tasks.length === 0) {
        await prisma.alert.create({
          data: {
            type: 'IDLE',
            title: `Idle Intern: ${intern.name}`,
            description: `${intern.name} has no active task assigned.`,
            severity: 'warning',
            internId: intern.id,
            projectId: intern.projectId,
          },
        });
      }

      // Blocker detection > 1 day
      for (const blocker of intern.blockers) {
        const days = blocker.daysBlocked || Math.ceil((now.getTime() - new Date(blocker.reportedDate).getTime()) / (1000 * 3600 * 24));
        await prisma.alert.create({
          data: {
            type: 'BLOCKED',
            title: `Blocked Intern: ${intern.name}`,
            description: `${intern.name} blocked on "${blocker.description.substring(0, 50)}..." for ${days} day(s).`,
            severity: days >= 2 ? 'critical' : 'warning',
            internId: intern.id,
            projectId: intern.projectId,
          },
        });
      }

      // No update for > 2 days
      const lastUpdateDate = intern.dailyUpdates[0]?.date || intern.lastUpdated;
      const daysSinceUpdate = Math.floor((now.getTime() - new Date(lastUpdateDate).getTime()) / (1000 * 3600 * 24));
      if (daysSinceUpdate >= 2) {
        await prisma.alert.create({
          data: {
            type: 'NO_UPDATE',
            title: `Missing Updates: ${intern.name}`,
            description: `No daily update submitted by ${intern.name} in the last ${daysSinceUpdate} days.`,
            severity: 'info',
            internId: intern.id,
            projectId: intern.projectId,
          },
        });
      }
    }

    // 2. Overdue Tasks (scoped)
    const overdueTasks = await prisma.task.findMany({
      where: {
        ...(hasScope ? { intern: internWhere } : {}),
        status: { in: ['Working', 'Waiting Review', 'Not Started'] },
        deadline: { lt: now },
      },
      include: { intern: true, project: true },
    });

    for (const task of overdueTasks) {
      await prisma.alert.create({
        data: {
          type: 'OVERDUE',
          title: `Overdue Task: ${task.taskId}`,
          description: `Task "${task.description.substring(0, 45)}" assigned to ${task.intern.name} missed deadline.`,
          severity: 'warning',
          internId: task.internId,
          projectId: task.projectId,
        },
      });
    }

  } catch (error) {
    console.error('Error refreshing alerts:', error);
  }
}
