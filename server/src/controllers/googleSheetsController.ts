import { Response } from 'express';
import { prisma } from '../db.js';
import { DEFAULT_COLUMN_MAPPING, syncSheetData } from '../services/googleSheetsService.js';
import { logAudit } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/google-sheets/config - Get column mapping & sync configuration (ADMIN only)
export async function getGoogleSheetConfig(req: AuthenticatedRequest, res: Response) {
  try {
    let config = await prisma.googleSheetConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await prisma.googleSheetConfig.create({
        data: {
          id: 'default',
          spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          sheetName: 'Interns Master 2026',
          columnMapping: JSON.stringify(DEFAULT_COLUMN_MAPPING),
        },
      });
    }

    const mapping = JSON.parse(config.columnMapping || '{}');
    const logs = await prisma.syncLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
    });

    return res.json({ config, mapping, logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch Google Sheets config' });
  }
}

// POST /api/google-sheets/config - Save column mapping (ADMIN only)
export async function saveGoogleSheetConfig(req: AuthenticatedRequest, res: Response) {
  try {
    const { spreadsheetId, sheetName, columnMapping, autoSync } = req.body;

    const oldConfig = await prisma.googleSheetConfig.findUnique({ where: { id: 'default' } });

    const config = await prisma.googleSheetConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        spreadsheetId,
        sheetName,
        columnMapping: JSON.stringify(columnMapping || DEFAULT_COLUMN_MAPPING),
        autoSync: autoSync || false,
      },
      update: {
        spreadsheetId,
        sheetName,
        columnMapping: JSON.stringify(columnMapping || DEFAULT_COLUMN_MAPPING),
        autoSync: autoSync !== undefined ? autoSync : false,
      },
    });

    await logAudit('GoogleSheetConfig', 'default', 'UPDATE', req.user?.name || 'Admin', oldConfig, config);
    return res.json({ config, mapping: JSON.parse(config.columnMapping) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to save Google Sheets config' });
  }
}

// POST /api/google-sheets/sync - Execute Google Sheets data synchronization (ADMIN only)
export async function triggerGoogleSheetSync(req: AuthenticatedRequest, res: Response) {
  try {
    const { sampleRows, columnMapping } = req.body;

    const config = await prisma.googleSheetConfig.findUnique({ where: { id: 'default' } });
    const mapping = columnMapping || (config?.columnMapping ? JSON.parse(config.columnMapping) : DEFAULT_COLUMN_MAPPING);

    const rowsToProcess = sampleRows && sampleRows.length > 0 ? sampleRows : [
      { 'S.No': 1, 'Intern Name': 'Rahul Kumar', 'Email': 'rahul.kumar@company.com', 'Phone': '+91 98765 40000', 'Project': 'GLC AI Lead Intelligence', 'Module': 'Email Automation', 'Today\'s Task': 'Email validation API', 'Status': 'Working', 'Progress %': 85, 'Blocker': '' },
      { 'S.No': 2, 'Intern Name': 'Priya Verma', 'Email': 'priya.verma@company.com', 'Phone': '+91 98765 40001', 'Project': 'CII B2B Portal', 'Module': 'Salesforce OAuth', 'Today\'s Task': 'OAuth Integration', 'Status': 'Blocked', 'Progress %': 30, 'Blocker': 'Salesforce Client Secret Approval' },
      { 'S.No': 3, 'Intern Name': 'Siddharth Rao', 'Email': 'siddharth.rao@company.com', 'Phone': '+91 98765 40003', 'Project': 'GLC AI Lead Intelligence', 'Module': 'Lead Scoring API', 'Today\'s Task': 'Finished yesterday', 'Status': 'No Task', 'Progress %': 100, 'Blocker': '' },
      { 'S.No': 4, 'Intern Name': 'Manish Singh', 'Email': 'manish.singh@company.com', 'Phone': '+91 98765 40009', 'Project': 'Data Analytics Hub', 'Module': 'CSV Export', 'Today\'s Task': 'Waiting for next spec', 'Status': 'No Task', 'Progress %': 100, 'Blocker': '' },
      { 'S.No': 5, 'Intern Name': 'New Sync Intern', 'Email': 'new.sync@company.com', 'Phone': '+91 98765 40099', 'Project': 'Tender Discovery Engine', 'Module': 'PDF Extraction', 'Today\'s Task': 'Set up PDF parser', 'Status': 'Working', 'Progress %': 25, 'Blocker': '' },
    ];

    const result = await syncSheetData(rowsToProcess, mapping, `Google Sheets Sync by ${req.user?.name || 'Admin'}`);

    await prisma.googleSheetConfig.update({
      where: { id: 'default' },
      data: { lastSyncAt: new Date() },
    });

    return res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Synchronization failed' });
  }
}
