import { Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/evaluations - Get FT Evaluations list (ADMIN and TEAM_LEAD only)
export async function getFTEvaluations(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (user?.role === 'INTERN') {
      return res.status(403).json({ error: 'Forbidden: Full-Time evaluations are restricted to Leadership.' });
    }

    const { level } = req.query;
    const whereClause: any = {};

    if (user?.role === 'TEAM_LEAD') {
      whereClause.OR = [
        { project: { projectLead: user.name } },
        ...(user.teamId ? [{ teamId: user.teamId }] : []),
      ];
    }

    if (level && level !== 'all') {
      whereClause.ftPotential = String(level);
    }

    const interns = await prisma.intern.findMany({
      where: whereClause,
      include: {
        project: { select: { name: true } },
        team: { select: { leadName: true } },
        ftEvaluations: { orderBy: { evaluationDate: 'desc' } },
        tasks: { where: { status: 'Completed' }, select: { id: true, description: true } },
      },
      orderBy: { ftPotential: 'asc' },
    });

    return res.json({ evaluations: interns });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch FT evaluations' });
  }
}

// POST /api/evaluations - Record or update FT evaluation (ADMIN only)
export async function createFTEvaluation(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { internId, potentialLevel, evidence, evaluationNotes, evaluatedBy } = req.body;

    const oldIntern = await prisma.intern.findUnique({ where: { id: internId } });
    if (!oldIntern) return res.status(404).json({ error: 'Intern not found' });

    // Update intern FT Potential level
    await prisma.intern.update({
      where: { id: internId },
      data: {
        ftPotential: potentialLevel,
        learningEvidence: evidence || oldIntern.learningEvidence,
        lastUpdated: new Date(),
      },
    });

    // Save evaluation record history
    const evaluation = await prisma.fTEvaluation.create({
      data: {
        internId,
        potentialLevel,
        evidence: evidence || 'Assessment based on task execution and independence.',
        evaluationNotes: evaluationNotes || null,
        evaluatedBy: evaluatedBy || user?.name || 'Admin',
        evaluationDate: new Date(),
      },
    });

    await logAudit('FTEvaluation', evaluation.id, 'CREATE', user?.name || 'Admin', oldIntern.ftPotential, potentialLevel);
    return res.status(201).json({ evaluation });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to record FT evaluation' });
  }
}
