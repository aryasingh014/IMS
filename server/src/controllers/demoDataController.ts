import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';

// POST /api/demo-data/reset - Re-run database seed script
export async function resetDemoData(req: Request, res: Response) {
  try {
    const cwd = process.cwd();
    exec('npm run seed', { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error('Seed execution error:', error);
        return res.status(500).json({ error: 'Failed to reset demo data: ' + error.message });
      }
      return res.json({ message: 'Demo data re-seeded successfully', output: stdout });
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to trigger demo data reset' });
  }
}
