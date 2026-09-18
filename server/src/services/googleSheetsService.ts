import { prisma } from '../db.js';
import { logAudit } from './auditService.js';

export interface ColumnMapping {
  intern_name?: string;
  email?: string;
  phone?: string;
  project?: string;
  module?: string;
  task?: string;
  status?: string;
  progress?: string;
  blocker?: string;
  [key: string]: string | undefined;
}

export interface SheetRowData {
  [headerName: string]: string | number;
}

// Standard default column mapping
export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  'Intern Name': 'intern_name',
  'Email': 'email',
  'Phone': 'phone',
  'Project': 'project',
  'Module': 'module',
  'Today\'s Task': 'task',
  'Status': 'status',
  'Progress %': 'progress',
  'Blocker': 'blocker',
};

// Process array of rows using provided mapping
export async function syncSheetData(
  rows: SheetRowData[],
  columnMapping: ColumnMapping,
  source: string = 'Google Sheets Sync'
) {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    try {
      // Invert mapping: app field name -> value in row
      const mappedRecord: Record<string, string> = {};

      Object.entries(columnMapping).forEach(([sheetHeader, appField]) => {
        if (appField && row[sheetHeader] !== undefined) {
          mappedRecord[appField] = String(row[sheetHeader]).trim();
        }
      });

      const email = mappedRecord.email || mappedRecord.intern_name?.toLowerCase().replace(/\s+/g, '.') + '@company.com';
      const name = mappedRecord.intern_name || mappedRecord.name || `Intern ${index + 1}`;
      const projectName = mappedRecord.project || 'General Operations';
      const moduleName = mappedRecord.module || 'Core Module';
      const taskDesc = mappedRecord.task || 'General Assigned Tasks';
      const statusRaw = mappedRecord.status || 'Working';
      const progressNum = parseInt(mappedRecord.progress || '0', 10) || 0;
      const blockerText = mappedRecord.blocker || null;

      // Normalize status
      let status = 'Working';
      const statusLower = statusRaw.toLowerCase();
      if (statusLower.includes('block')) status = 'Blocked';
      else if (statusLower.includes('no task') || statusLower.includes('idle')) status = 'No Task';
      else if (statusLower.includes('wait') || statusLower.includes('review')) status = 'Waiting Review';
      else if (statusLower.includes('complete') || statusLower.includes('done')) status = 'Completed';

      // 1. Ensure Project exists
      let project = await prisma.project.findUnique({
        where: { name: projectName },
      });
      if (!project) {
        project = await prisma.project.create({
          data: {
            name: projectName,
            projectLead: 'Admin Team Lead',
            description: `Imported via Google Sheets: ${projectName}`,
          },
        });
      }

      // 2. Find or create Intern
      let intern = await prisma.intern.findFirst({
        where: { OR: [{ email: email }, { name: name }] },
      });

      let isNew = false;
      if (!intern) {
        isNew = true;
        const totalInterns = await prisma.intern.count();
        intern = await prisma.intern.create({
          data: {
            internId: `INT-${1000 + totalInterns + 1}`,
            name,
            email,
            phone: mappedRecord.phone || null,
            module: moduleName,
            status,
            projectId: project.id,
            lastUpdated: new Date(),
          },
        });
        importedCount++;
        await logAudit('Intern', intern.id, 'CREATE', 'GoogleSheetsSync', null, intern);
      } else {
        // Update intern
        const oldVal = { ...intern };
        intern = await prisma.intern.update({
          where: { id: intern.id },
          data: {
            module: moduleName,
            status,
            projectId: project.id,
            lastUpdated: new Date(),
          },
        });
        updatedCount++;
        await logAudit('Intern', intern.id, 'UPDATE', 'GoogleSheetsSync', oldVal, intern);
      }

      // 3. Upsert Task
      const existingTask = await prisma.task.findFirst({
        where: { internId: intern.id, description: taskDesc },
      });

      if (!existingTask) {
        const totalTasks = await prisma.task.count();
        await prisma.task.create({
          data: {
            taskId: `TSK-${2000 + totalTasks + 1}`,
            description: taskDesc,
            module: moduleName,
            status: status === 'No Task' ? 'Completed' : status,
            progress: progressNum,
            internId: intern.id,
            projectId: project.id,
          },
        });
      } else {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            status: status === 'No Task' ? 'Completed' : status,
            progress: progressNum,
          },
        });
      }

      // 4. Handle Blocker if specified
      if (status === 'Blocked' || blockerText) {
        const existingBlocker = await prisma.blocker.findFirst({
          where: { internId: intern.id, status: 'Open' },
        });

        if (!existingBlocker) {
          await prisma.blocker.create({
            data: {
              description: blockerText || `Blocked on ${moduleName} task.`,
              reportedDate: new Date(),
              status: 'Open',
              internId: intern.id,
            },
          });
        }
      }
    } catch (err: any) {
      skippedCount++;
      errors.push(`Row ${index + 1}: ${err?.message || 'Unknown error'}`);
    }
  }

  // Create Sync Log Record
  const syncLog = await prisma.syncLog.create({
    data: {
      source,
      status: errors.length > 0 ? (importedCount > 0 ? 'Warning' : 'Error') : 'Success',
      importedCount,
      updatedCount,
      skippedCount,
      errorLog: errors.length > 0 ? errors.join('\n') : 'Synced successfully.',
    },
  });

  return {
    syncLog,
    summary: {
      totalProcessed: rows.length,
      importedCount,
      updatedCount,
      skippedCount,
      errors,
    },
  };
}
