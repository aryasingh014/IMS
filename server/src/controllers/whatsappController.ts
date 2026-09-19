import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { approveWhatsAppUpdate, processIncomingWhatsAppMessage, rejectWhatsAppUpdate } from '../services/whatsappService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// GET /api/whatsapp/pending - List pending updates for admin review (ADMIN only)
export async function getPendingWhatsAppUpdates(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

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

// POST /api/whatsapp/approve/:id - Admin approves update (ADMIN only)
export async function approveUpdate(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    const { id } = req.params;
    const intern = await approveWhatsAppUpdate(id);
    return res.json({ success: true, intern });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to approve update' });
  }
}

// POST /api/whatsapp/reject/:id - Admin rejects update (ADMIN only)
export async function rejectUpdate(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    const { id } = req.params;
    const record = await rejectWhatsAppUpdate(id);
    return res.json({ success: true, record });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to reject update' });
  }
}

// POST /api/whatsapp/webhook - Incoming WhatsApp webhook receiver with mandatory token verification
export async function receiveWebhook(req: Request, res: Response) {
  try {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'intern_mgmt_whatsapp_secret';
    const providedToken = req.headers['x-verify-token'] || req.query['verify_token'] || req.body?.verifyToken;

    // Strict token verification for webhook
    if (!providedToken || providedToken !== verifyToken) {
      return res.status(403).json({ error: 'Forbidden: Invalid or missing webhook verification token.' });
    }

    const { senderPhone, rawMessage, senderName } = req.body;
    if (!senderPhone || !rawMessage) {
      return res.status(400).json({ error: 'senderPhone and rawMessage are required.' });
    }

    const record = await processIncomingWhatsAppMessage(senderPhone, rawMessage, senderName);
    return res.status(201).json({ success: true, record });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to process webhook' });
  }
}
