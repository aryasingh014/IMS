import { Response } from 'express';
import { execSync } from 'child_process';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

// POST /api/demo-data/reset - Re-run database seed script (ADMIN only)
export async function resetDemoData(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only system administrators can reset system data.' });
    }

    // ponytail: synchronous execution without verbose event listener plumbing
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const output = execSync(`${npmCmd} run seed`, { timeout: 60000, encoding: 'utf-8' });

    await logAudit('System', 'Database', 'UPDATE', user.name, null, 'Database re-seeded');
    return res.json({ message: 'Demo data re-seeded successfully', output });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to trigger demo data reset' });
  }
}
