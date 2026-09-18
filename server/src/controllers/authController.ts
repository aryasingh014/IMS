import { Request, Response } from 'express';
import { prisma } from '../db.js';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    // Simple admin login check (prepared for JWT expansion)
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    return res.json({
      token: 'admin-jwt-token-demo',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
}

export async function getProfile(req: Request, res: Response) {
  const user = await prisma.user.findFirst();
  return res.json({ user });
}
