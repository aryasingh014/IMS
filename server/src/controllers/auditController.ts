import { Request, Response } from 'express';
import { prisma } from '../db.js';

// GET /api/audit-logs - System change history
export async function getAuditLogs(req: Request, res: Response) {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
    });
    return res.json({ logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
}
