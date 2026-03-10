import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_default';

const isBcryptHash = (value: string) => {
  return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordOk = isBcryptHash(user.password) ? await bcrypt.compare(password, user.password) : user.password === password;
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Falha ao realizar login' });
  }
};

export const setupAdmin = async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const count = await prisma.user.count();
    if (count > 0) {
      return res.status(409).json({ error: 'Setup já realizado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'admin' },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(201).json({ user });
  } catch (error) {
    console.error('Error during setup:', error);
    return res.status(500).json({ error: 'Falha ao realizar setup' });
  }
};
