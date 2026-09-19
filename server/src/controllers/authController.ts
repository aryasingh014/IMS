import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { hashPassword, verifyPassword } from '../utils/passwordUtils.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-intern-management-2026';

// POST /api/auth/register - Public self-registration for Team Leads & Interns
export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role, phone, module } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['TEAM_LEAD', 'INTERN'].includes(role)) {
      return res.status(400).json({ error: 'Only TEAM_LEAD or INTERN can self-register' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Default avatar
    const defaultAvatar =
      role === 'TEAM_LEAD'
        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';

    // ponytail: register with status 'PENDING' requiring Admin approval
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashPassword(password),
        role,
        status: 'PENDING',
        phone: phone || null,
        module: module || null,
        avatar: defaultAvatar,
      },
    });

    await logAudit('User', newUser.id, 'CREATE', newUser.name, null, {
      role: newUser.role,
      status: 'PENDING',
    });

    return res.status(201).json({
      message: 'Registration submitted successfully! Your account is pending Admin approval.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
}

// POST /api/auth/login - Login with approval verification
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check approval status
    if (user.status === 'PENDING') {
      return res.status(403).json({
        error: 'Your account is pending Admin approval. Please wait for an administrator to approve your request.',
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        error: 'Your registration request was rejected by the administrator.',
      });
    }

    // Resolve context for Team Lead or Intern
    let teamId: string | null = null;
    let internId = user.internId;

    if (user.role === 'TEAM_LEAD') {
      const team = await prisma.team.findFirst({
        where: { leadName: user.name },
      });
      teamId = team?.id || null;
    } else if (user.role === 'INTERN' && !internId) {
      const intern = await prisma.intern.findUnique({
        where: { email: user.email },
      });
      internId = intern?.id || null;
    }

    // ponytail: signed real JWT with 24h expiration
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        internId,
        teamId,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        internId,
        teamId,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
}

// GET /api/auth/registrations/pending - Get pending user registrations (ADMIN only)
export async function getPendingRegistrations(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        module: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ pendingUsers: users });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch pending registrations' });
  }
}

// POST /api/auth/registrations/:id/approve - Approve user registration (ADMIN only)
export async function approveRegistration(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return res.status(404).json({ error: 'User registration request not found' });

    let internId = user.internId;

    // ponytail: auto-provision Intern directory record when approving an INTERN registration
    if (user.role === 'INTERN' && !internId) {
      let intern = await prisma.intern.findUnique({ where: { email: user.email } });
      if (!intern) {
        const totalInterns = await prisma.intern.count();
        intern = await prisma.intern.create({
          data: {
            internId: `INT-${1001 + totalInterns}`,
            name: user.name,
            email: user.email,
            phone: user.phone || null,
            module: user.module || 'General Engineering',
            status: 'No Task', // Ready for project assignment
          },
        });
      }
      internId = intern.id;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: 'APPROVED',
        internId,
      },
    });

    await logAudit('User', id, 'UPDATE', req.user?.name || 'Admin', { status: 'PENDING' }, { status: 'APPROVED' });

    return res.json({
      message: `User ${updatedUser.name} (${updatedUser.role}) approved successfully!`,
      user: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to approve registration' });
  }
}

// POST /api/auth/registrations/:id/reject - Reject user registration (ADMIN only)
export async function rejectRegistration(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return res.status(404).json({ error: 'User registration request not found' });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    await logAudit('User', id, 'UPDATE', req.user?.name || 'Admin', { status: 'PENDING' }, { status: 'REJECTED' });

    return res.json({
      message: `User ${updatedUser.name} registration request rejected.`,
      user: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to reject registration' });
  }
}

// GET /api/auth/profile - Fetch current authenticated user profile
export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        internId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
}
