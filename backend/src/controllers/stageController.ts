import { Request, Response } from 'express';
import prisma from '../config/database';

export const getStages = async (req: Request, res: Response) => {
  try {
    const boardKey = typeof req.query.boardKey === 'string' ? req.query.boardKey : 'default';
    const onlyActive = String(req.query.active ?? 'true').toLowerCase() !== 'false';

    const stages = await prisma.stage.findMany({
      where: {
        boardKey,
        ...(onlyActive ? { active: true } : {}),
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    res.json(stages);
  } catch (error) {
    console.error('Error fetching stages:', error);
    const code = (error as any)?.code;
    if (code === 'P1001') {
      res.status(503).json({ error: 'Banco de dados indisponível. Verifique se o servidor está online e acessível.' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch stages' });
  }
};
