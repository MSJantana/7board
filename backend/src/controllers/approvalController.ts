import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

const APPROVAL_TOKEN_SECRET = process.env.APPROVAL_TOKEN_SECRET || process.env.JWT_SECRET || 'secret_key_default';

type ApprovalTokenPayload = {
  cardId: string;
  email: string;
  purpose: 'approval';
  tokenId: string;
};

const parseToken = (token: string): ApprovalTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, APPROVAL_TOKEN_SECRET) as any;
    if (!decoded || typeof decoded !== 'object') return null;
    if (decoded.purpose !== 'approval') return null;
    const cardId = typeof decoded.cardId === 'string' ? decoded.cardId : '';
    const email = typeof decoded.email === 'string' ? decoded.email : '';
    const tokenId = typeof decoded.tokenId === 'string' ? decoded.tokenId : '';
    if (!cardId || !email || !tokenId) return null;
    return { cardId, email, purpose: 'approval', tokenId };
  } catch {
    return null;
  }
};

const formatLogDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
};

const appendLogLine = (existing: string | null | undefined, now: Date, text: string) => {
  const line = `[${formatLogDate(now)}] ${text}`;
  const base = existing ?? '';
  if (!base.trim()) return line;
  return `${base}\n${line}`;
};

export const getApprovalData = async (req: Request, res: Response) => {
  const { id } = req.params;
  const token = typeof req.query.token === 'string' ? req.query.token : '';

  if (!token) {
    return res.status(400).json({ error: 'Token é obrigatório' });
  }

  const payload = parseToken(token);
  if (payload?.cardId !== String(id)) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const lastEmail = await prisma.solicitacaoActivity.findFirst({
    where: { solicitacaoId: String(id), type: 'NOTE', message: 'Email de aprovação enviado.' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, data: true },
  });
  const lastTokenId = (lastEmail?.data as any)?.approvalTokenId;
  if (typeof lastTokenId !== 'string' || lastTokenId.trim() !== payload.tokenId) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const possibleResponses = await prisma.solicitacaoActivity.findMany({
    where: {
      solicitacaoId: String(id),
      type: 'COMMENT',
      createdAt: lastEmail?.createdAt ? { gte: lastEmail.createdAt } : undefined,
    },
    orderBy: { createdAt: 'desc' },
    select: { data: true },
    take: 20,
  });
  const alreadyUsed = possibleResponses.some((a) => (a.data as any)?.approvalTokenId === payload.tokenId);
  if (alreadyUsed) {
    return res.status(410).json({ error: 'Link já utilizado' });
  }

  let card: any;
  try {
    card = await prisma.solicitacao.findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        departamento: true,
        email: true,
        protocolo: true,
        tipoSolicitacao: true,
        deliveryAt: true,
        stage: { select: { name: true, kind: true } },
        approvalStatus: true,
        approvalMessage: true,
        approvalLinks: true,
        approvalUpdatedAt: true,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados de aprovação:', error);
    return res.status(500).json({ error: 'Aprovação não configurada ou banco desatualizado' });
  }

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  if (!card.email || card.email !== payload.email) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const stageName = card.stage?.name ?? '';
  const stageKind = card.stage?.kind ?? null;
  const allowed = stageName === 'A Aprovar' || stageKind === 'VALIDATION';
  if (!allowed) {
    return res.status(400).json({ error: 'Card não está na etapa de aprovação' });
  }

  const links = Array.isArray(card.approvalLinks) ? card.approvalLinks : [];
  return res.json({ card, links });
};

export const submitApproval = async (req: Request, res: Response) => {
  const { token, decision, comment } = req.body as {
    token?: string;
    decision?: string;
    comment?: string;
  };

  const normalizedToken = typeof token === 'string' ? token.trim() : '';
  if (!normalizedToken) {
    return res.status(400).json({ error: 'Token é obrigatório' });
  }

  const payload = parseToken(normalizedToken);
  if (!payload) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const normalizedDecision = typeof decision === 'string' ? decision.trim().toUpperCase() : '';
  let nextStatus: 'APPROVED' | 'CHANGES_REQUESTED' | null = null;
  if (normalizedDecision === 'APPROVED') {
    nextStatus = 'APPROVED';
  } else if (normalizedDecision === 'CHANGES_REQUESTED' || normalizedDecision === 'CHANGES') {
    nextStatus = 'CHANGES_REQUESTED';
  }

  if (!nextStatus) {
    return res.status(400).json({ error: 'Decisão inválida' });
  }

  const message = typeof comment === 'string' ? comment.trim() : '';

  let card: any;
  try {
    card = await prisma.solicitacao.findUnique({
      where: { id: payload.cardId },
      include: { stage: true },
    });
  } catch (error) {
    console.error('Erro ao buscar solicitação para aprovação:', error);
    return res.status(500).json({ error: 'Aprovação não configurada ou banco desatualizado' });
  }

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  if (!card.email || card.email !== payload.email) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const lastEmail = await prisma.solicitacaoActivity.findFirst({
    where: { solicitacaoId: card.id, type: 'NOTE', message: 'Email de aprovação enviado.' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, data: true },
  });
  const lastTokenId = (lastEmail?.data as any)?.approvalTokenId;
  if (typeof lastTokenId !== 'string' || lastTokenId.trim() !== payload.tokenId) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const possibleResponses = await prisma.solicitacaoActivity.findMany({
    where: {
      solicitacaoId: card.id,
      type: 'COMMENT',
      createdAt: lastEmail?.createdAt ? { gte: lastEmail.createdAt } : undefined,
    },
    orderBy: { createdAt: 'desc' },
    select: { data: true },
    take: 20,
  });
  const alreadyUsed = possibleResponses.some((a) => (a.data as any)?.approvalTokenId === payload.tokenId);
  if (alreadyUsed) {
    return res.status(410).json({ error: 'Link já utilizado' });
  }

  const stageName = card.stage?.name ?? '';
  const stageKind = card.stage?.kind ?? null;
  const allowed = stageName === 'A Aprovar' || stageKind === 'VALIDATION';
  if (!allowed) {
    return res.status(400).json({ error: 'Card não está na etapa de aprovação' });
  }

  const now = new Date();

  let updated: any;
  try {
    const updateData: any = {
      approvalStatus: nextStatus as any,
      approvalMessage: message || null,
      approvalUpdatedAt: now,
    };

    let deliveryChange: { from: Date; to: Date } | null = null;
    if (nextStatus === 'CHANGES_REQUESTED') {
      const currentDeliveryAt = new Date(card.deliveryAt);
      const base = currentDeliveryAt.getTime() > now.getTime() ? currentDeliveryAt : now;
      const nextDeliveryAt = new Date(base.getTime() + 72 * 60 * 60 * 1000);
      updateData.deliveryAt = nextDeliveryAt;
      deliveryChange = { from: currentDeliveryAt, to: nextDeliveryAt };
      updateData.observacoes = appendLogLine(card.observacoes, now, 'Prazo alterado.');
    }

    updated = await prisma.solicitacao.update({
      where: { id: card.id },
      data: updateData,
      select: {
        id: true,
        approvalStatus: true,
        approvalMessage: true,
        approvalUpdatedAt: true,
        deliveryAt: true,
      },
    });

    if (deliveryChange) {
      await prisma.solicitacaoActivity.create({
        data: {
          solicitacaoId: card.id,
          type: 'NOTE',
          message: 'Prazo alterado.',
          data: { from: deliveryChange.from.toISOString(), to: deliveryChange.to.toISOString() },
          actorId: null,
        },
      });
    }
  } catch (error) {
    console.error('Erro ao salvar resposta de aprovação:', error);
    return res.status(500).json({ error: 'Aprovação não configurada ou banco desatualizado' });
  }

  await prisma.solicitacaoActivity.create({
    data: {
      solicitacaoId: card.id,
      type: 'COMMENT',
      message: nextStatus === 'APPROVED' ? 'Aprovação registrada: aprovado.' : 'Aprovação registrada: ajustes solicitados.',
      data: { approvalStatus: nextStatus, comment: message || null, approvalTokenId: payload.tokenId },
      actorId: null,
    },
  });

  return res.json({ ok: true, updated });
};
