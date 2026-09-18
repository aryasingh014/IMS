import { prisma } from '../db.js';

export async function refreshAlerts() {
  try {
    // Clear old unacknowledged auto-generated alerts to refresh
    await prisma.alert.deleteMany({
      where: { isAcknowledged: false },
    });

    const now = new Date();

    // 1. Detect Idle Interns (No working/waiting task or no task at all)
    const interns = await prisma.intern.findMany({
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

    // 2. Overdue Tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
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
