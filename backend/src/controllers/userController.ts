import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';

const normalizeParam = (value: unknown): string | undefined => {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' ? value : undefined;
};

const normalizeRoleEnum = (role: unknown) => {
  const value = String(role ?? '').trim();
  const lower = value.toLowerCase();
  if (lower === 'admin' || value === 'ADMIN') return 'ADMIN' as const;
  if (lower === 'manager' || value === 'MANAGER') return 'MANAGER' as const;
  if (lower === 'agent' || value === 'AGENT') return 'AGENT' as const;
  return 'USER' as const;
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const id = normalizeParam(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

  const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        roleEnum: normalizeRoleEnum(role),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const id = normalizeParam(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  const { name, email, role } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        roleEnum: normalizeRoleEnum(role),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = normalizeParam(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  try {
    await prisma.user.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
