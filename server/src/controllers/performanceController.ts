import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';

// GET /api/performance - Performance indicators matrix for all interns
export async function getPerformanceOverview(req: Request, res: Response) {
  try {
    const interns = await prisma.intern.findMany({
      include: {
        project: { select: { name: true } },
        team: { select: { name: true, leadName: true } },
        tasks: {
          select: { status: true },
        },

        dailyUpdates: { take: 5, orderBy: { date: 'desc' } },
        performanceReviews: { take: 1, orderBy: { reviewDate: 'desc' } },
      },
      orderBy: { learningSpeed: 'desc' },
    });

    const formatted = interns.map((i) => {
      const completedTasksCount = i.tasks.filter((t) => t.status === 'Completed').length;
      const totalTasksCount = i.tasks.length;
      const blockedTasksCount = i.tasks.filter((t) => t.status === 'Blocked').length;

      return {
        id: i.id,
        internId: i.internId,
        name: i.name,
        email: i.email,
        projectName: i.project?.name || 'Unassigned',
        teamLead: i.team?.leadName || 'Admin',
        learningSpeed: i.learningSpeed,
        technicalAbility: i.technicalAbility,
        ownership: i.ownership,
        workQuality: i.workQuality,
        consistency: i.consistency,
        communication: i.communication,
        problemSolving: i.problemSolving,
        learningEvidence: i.learningEvidence,
        ftPotential: i.ftPotential,
        completedTasksCount,
        totalTasksCount,
        blockedTasksCount,
        updatesCount: i.dailyUpdates.length,
      };
    });

    return res.json({ performance: formatted });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch performance overview' });
  }
}

// POST /api/performance/review - Submit/update performance review ratings for an intern
export async function submitPerformanceReview(req: Request, res: Response) {
  try {
    const {
      internId,
      learningSpeed,
      technicalAbility,
      ownership,
      workQuality,
      consistency,
      communication,
      problemSolving,
      evidenceNotes,
      reviewedBy,
    } = req.body;

    const oldIntern = await prisma.intern.findUnique({ where: { id: internId } });
    if (!oldIntern) return res.status(404).json({ error: 'Intern not found' });

    // Update intern current rating metrics
    const updatedIntern = await prisma.intern.update({
      where: { id: internId },
      data: {
        learningSpeed: learningSpeed !== undefined ? parseInt(learningSpeed, 10) : oldIntern.learningSpeed,
        technicalAbility: technicalAbility !== undefined ? parseInt(technicalAbility, 10) : oldIntern.technicalAbility,
        ownership: ownership !== undefined ? parseInt(ownership, 10) : oldIntern.ownership,
        workQuality: workQuality !== undefined ? parseInt(workQuality, 10) : oldIntern.workQuality,
        consistency: consistency !== undefined ? parseInt(consistency, 10) : oldIntern.consistency,
        communication: communication !== undefined ? parseInt(communication, 10) : oldIntern.communication,
        problemSolving: problemSolving !== undefined ? parseInt(problemSolving, 10) : oldIntern.problemSolving,
        learningEvidence: evidenceNotes || oldIntern.learningEvidence,
        lastUpdated: new Date(),
      },
    });

    // Create history review record
    const review = await prisma.performanceReview.create({
      data: {
        internId,
        learningSpeed: updatedIntern.learningSpeed,
        technicalAbility: updatedIntern.technicalAbility,
        ownership: updatedIntern.ownership,
        workQuality: updatedIntern.workQuality,
        consistency: updatedIntern.consistency,
        communication: updatedIntern.communication,
        problemSolving: updatedIntern.problemSolving,
        evidenceNotes: evidenceNotes || null,
        reviewedBy: reviewedBy || 'Admin',
        reviewDate: new Date(),
      },
    });

    await logAudit('PerformanceReview', review.id, 'CREATE', 'Admin', oldIntern, updatedIntern);
    return res.status(201).json({ review, intern: updatedIntern });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to submit performance review' });
  }
}
