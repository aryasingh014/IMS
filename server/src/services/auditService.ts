import { prisma } from '../db.js';

export async function logAudit(
  entity: string,
  entityId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  changedBy: string = 'Admin',
  oldValue: any = null,
  newValue: any = null
) {
  try {
    await prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action,
        changedBy,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
