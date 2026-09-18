import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { logAudit } from '../services/auditService.js';

// GET /api/evaluations - Get FT Evaluations list & evidence logs
export async function getFTEvaluations(req: Request, res: Response) {
  try {
    const { level } = req.query;

    const whereClause: any = {};
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

// POST /api/evaluations - Record or update FT evaluation for an intern
export async function createFTEvaluation(req: Request, res: Response) {
  try {
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
        evaluatedBy: evaluatedBy || 'Admin',
        evaluationDate: new Date(),
      },
    });

    await logAudit('FTEvaluation', evaluation.id, 'CREATE', 'Admin', oldIntern.ftPotential, potentialLevel);
    return res.status(201).json({ evaluation });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to record FT evaluation' });
  }
}
