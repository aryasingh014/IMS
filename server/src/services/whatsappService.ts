import { prisma } from '../db.js';
import { logAudit } from './auditService.js';

export interface WhatsAppMessageDTO {
  id: string;
  senderPhone: string;
  senderName?: string;
  rawMessage: string;
  receivedAt: Date;
}

export interface ExtractedUpdateData {
  internName?: string;
  taskDescription?: string;
  status?: string;
  progress?: number;
  blocker?: string;
  confidence: number;
}

// Interface for WhatsAppProvider abstraction as specified in requirements
export interface WhatsAppProvider {
  getMessages(): Promise<WhatsAppMessageDTO[]>;
  sendMessage(to: string, text: string): Promise<boolean>;
  getGroups(): Promise<Array<{ id: string; name: string }>>;
  getGroupMessages(groupId: string): Promise<WhatsAppMessageDTO[]>;
}

// Interface for MessageParser
export interface MessageParser {
  parse(message: string): ExtractedUpdateData;
}

// 1. RuleBasedParser implementation
export class RuleBasedParser implements MessageParser {
  parse(message: string): ExtractedUpdateData {
    const trimmed = message.trim();
    let confidence = 0.85;

    // Split pattern: "Name - action/task - status/progress"
    const parts = trimmed.split('-').map((s) => s.trim());

    let internName: string | undefined = undefined;
    let taskDescription: string | undefined = undefined;
    let status: string | undefined = undefined;
    let progress: number | undefined = undefined;
    let blocker: string | undefined = undefined;

    if (parts.length >= 1) {
      internName = parts[0];
    }

    if (parts.length >= 2) {
      const middle = parts[1].toLowerCase();
      if (middle.includes('blocked')) {
        status = 'Blocked';
        blocker = parts[1].replace(/blocked on/i, '').trim();
      } else if (middle.includes('completed') || middle.includes('done')) {
        status = 'Completed';
        progress = 100;
        taskDescription = parts[1];
      } else {
        taskDescription = parts[1];
        status = 'Working';
      }
    }

    if (parts.length >= 3) {
      const last = parts[2].trim();
      const matchPct = last.match(/(\d+)%/);
      if (matchPct) {
        progress = parseInt(matchPct[1], 10);
      } else if (last.toLowerCase().includes('block')) {
        status = 'Blocked';
        blocker = last;
      }
    }

    // Default fallback parsing
    if (!status) {
      if (trimmed.toLowerCase().includes('blocked')) status = 'Blocked';
      else if (trimmed.toLowerCase().includes('done')) {
        status = 'Completed';
        progress = 100;
      } else status = 'Working';
    }

    return {
      internName,
      taskDescription: taskDescription || trimmed,
      status,
      progress,
      blocker,
      confidence,
    };
  }
}

// 2. Simulated WhatsApp Provider implementation
export class MockWhatsAppProvider implements WhatsAppProvider {
  async getMessages(): Promise<WhatsAppMessageDTO[]> {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { approvalStatus: 'Pending' },
      orderBy: { receivedAt: 'desc' },
    });

    return messages.map((m) => ({
      id: m.id,
      senderPhone: m.senderPhone,
      senderName: m.senderName || 'Unknown',
      rawMessage: m.rawMessage,
      receivedAt: m.receivedAt,
    }));
  }

  async sendMessage(to: string, text: string): Promise<boolean> {
    console.log(`[WhatsApp API Mock] Sending message to ${to}: ${text}`);
    return true;
  }

  async getGroups(): Promise<Array<{ id: string; name: string }>> {
    return [
      { id: 'grp_01', name: 'Intern Updates 2026' },
      { id: 'grp_02', name: 'GLC Lead Gen Team' },
    ];
  }

  async getGroupMessages(groupId: string): Promise<WhatsAppMessageDTO[]> {
    return this.getMessages();
  }
}

const parser = new RuleBasedParser();

// Process incoming raw WhatsApp text message into Pending update queue
export async function processIncomingWhatsAppMessage(
  senderPhone: string,
  rawMessage: string,
  senderName?: string
) {
  const extracted = parser.parse(rawMessage);

  // Match intern by phone or parsed name
  let intern = null;
  if (extracted.internName) {
    intern = await prisma.intern.findFirst({
      where: {
        OR: [
          { name: { contains: extracted.internName } },
          { phone: senderPhone },
        ],
      },
    });
  }

  const record = await prisma.whatsAppMessage.create({
    data: {
      senderPhone,
      senderName: senderName || extracted.internName || 'Unknown',
      rawMessage,
      extractedTask: extracted.taskDescription,
      extractedStatus: extracted.status,
      extractedProgress: extracted.progress,
      extractedBlocker: extracted.blocker,
      confidence: extracted.confidence,
      parserType: 'RuleBasedParser',
      approvalStatus: 'Pending',
      internId: intern?.id || null,
    },
  });

  return record;
}

// Approve pending WhatsApp update -> apply changes to Intern & Task in DB
export async function approveWhatsAppUpdate(messageId: string) {
  const msg = await prisma.whatsAppMessage.findUnique({
    where: { id: messageId },
    include: { intern: true },
  });

  if (!msg) throw new Error('WhatsApp message record not found');

  if (!msg.internId) {
    throw new Error('Cannot approve message without linked Intern record. Please edit and assign intern first.');
  }

  const intern = msg.intern!;
  const newStatus = msg.extractedStatus || intern.status;

  // Update intern status & last updated
  const updatedIntern = await prisma.intern.update({
    where: { id: intern.id },
    data: {
      status: newStatus,
      lastUpdated: new Date(),
    },
  });

  // Update active task if exists or create new task
  const activeTask = await prisma.task.findFirst({
    where: { internId: intern.id, status: { in: ['Working', 'Waiting Review', 'Blocked'] } },
  });

  if (activeTask) {
    await prisma.task.update({
      where: { id: activeTask.id },
      data: {
        status: newStatus === 'No Task' ? 'Completed' : newStatus,
        progress: msg.extractedProgress !== null ? msg.extractedProgress : activeTask.progress,
      },
    });
  }

  // Handle blocker
  if (newStatus === 'Blocked' && msg.extractedBlocker) {
    await prisma.blocker.create({
      data: {
        description: msg.extractedBlocker,
        reportedDate: new Date(),
        status: 'Open',
        internId: intern.id,
        taskId: activeTask?.id || null,
      },
    });
  }

  // Create Daily Update entry
  await prisma.dailyUpdate.create({
    data: {
      date: new Date(),
      todayTask: msg.extractedTask || 'Updated via WhatsApp',
      completedToday: msg.extractedStatus === 'Completed' ? msg.extractedTask : null,
      blocker: msg.extractedBlocker || null,
      notes: `Ingested & approved from WhatsApp: "${msg.rawMessage}"`,
      internId: intern.id,
    },
  });

  // Mark message as Approved
  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data: { approvalStatus: 'Approved' },
  });

  await logAudit('WhatsAppMessage', messageId, 'UPDATE', 'Admin', { status: 'Pending' }, { status: 'Approved' });

  return updatedIntern;
}

// Reject pending WhatsApp update
export async function rejectWhatsAppUpdate(messageId: string) {
  const record = await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data: { approvalStatus: 'Rejected' },
  });

  await logAudit('WhatsAppMessage', messageId, 'UPDATE', 'Admin', { status: 'Pending' }, { status: 'Rejected' });
  return record;
}
