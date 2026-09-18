import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { approveWhatsAppUpdate, processIncomingWhatsAppMessage, rejectWhatsAppUpdate } from '../services/whatsappService.js';

// GET /api/whatsapp/pending - List pending updates for admin review
export async function getPendingWhatsAppUpdates(req: Request, res: Response) {
  try {
    const pendingMessages = await prisma.whatsAppMessage.findMany({
      where: { approvalStatus: 'Pending' },
      include: {
        intern: { select: { id: true, name: true, email: true, status: true, project: { select: { name: true } } } },
      },
      orderBy: { receivedAt: 'desc' },
    });

    const approvedCount = await prisma.whatsAppMessage.count({ where: { approvalStatus: 'Approved' } });
    const rejectedCount = await prisma.whatsAppMessage.count({ where: { approvalStatus: 'Rejected' } });

    return res.json({
      pendingMessages,
      stats: {
        pendingCount: pendingMessages.length,
        approvedCount,
        rejectedCount,
        lastSync: new Date(),
        connectionStatus: 'Connected (Webhook Active)',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch WhatsApp updates' });
  }
}

// POST /api/whatsapp/approve/:id - Admin approves update
export async function approveUpdate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const intern = await approveWhatsAppUpdate(id);
    return res.json({ success: true, intern });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to approve update' });
  }
}

// POST /api/whatsapp/reject/:id - Admin rejects update
export async function rejectUpdate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const record = await rejectWhatsAppUpdate(id);
    return res.json({ success: true, record });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to reject update' });
  }
}

// POST /api/whatsapp/webhook - Simulated or real incoming WhatsApp webhook receiver
export async function receiveWebhook(req: Request, res: Response) {
  try {
    const { senderPhone, rawMessage, senderName } = req.body;
    if (!senderPhone || !rawMessage) {
      return res.status(400).json({ error: 'senderPhone and rawMessage are required' });
    }

    const record = await processIncomingWhatsAppMessage(senderPhone, rawMessage, senderName);
    return res.status(201).json({ success: true, record });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to process webhook' });
  }
}
