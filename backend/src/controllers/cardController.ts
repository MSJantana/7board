import { Request, Response } from 'express';
import fs from 'node:fs';
import prisma from '../config/database';
import { sendSolicitacaoEmail, sendConclusaoEmail, sendReaberturaEmail, sendProducaoEmail } from '../services/emailService';

const legacyStatusToStageName: Record<string, string> = {
  todo: 'Novas solicitações',
  'video-materiais': 'Videos/Matérias',
  'cobertura-eventos': 'Cobertura de Eventos',
  arte: 'Arte',
  fazendo: 'Fazendo',
  'in-progress': 'Fazendo',
  aprovacao: 'A Aprovar',
  parado: 'Parado',
  done: 'Concluído',
  archived: 'Concluído',
};

const parseDeliveryAtLegacy = (dataEntrega?: string, horarioEntrega?: string | null) => {
  const value = String(dataEntrega ?? '').trim();
  if (!value) return null;
  const parts = value.split('-').map((x) => Number(x));
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  const hhmm = String(horarioEntrega ?? '').trim();
  if (hhmm) {
    const [h, m] = hhmm.split(':').map((x) => Number(x));
    return new Date(year, month - 1, day, h || 0, m || 0, 0, 0);
  }
  return new Date(year, month - 1, day, 23, 59, 59, 0);
};

const parseDeliveryAt = (raw: unknown, dataEntrega?: unknown, horarioEntrega?: unknown) => {
  const direct = typeof raw === 'string' ? raw.trim() : '';
  if (direct) {
    const d = new Date(direct);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const dateLegacy = typeof dataEntrega === 'string' ? dataEntrega : undefined;
  const timeLegacy = typeof horarioEntrega === 'string' ? horarioEntrega : undefined;
  return parseDeliveryAtLegacy(dateLegacy, timeLegacy);
};

export const getCards = async (req: Request, res: Response) => {
  try {
    const solicitacoes = await prisma.solicitacao.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        stage: true,
      },
    });
    res.json(solicitacoes);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
};

const parseVeiculacao = (veiculacao: any): string[] => {
  try {
    if (typeof veiculacao === 'string') {
      return veiculacao.startsWith('[') ? JSON.parse(veiculacao) : [veiculacao];
    }
    return Array.isArray(veiculacao) ? veiculacao : [];
  } catch (e) {
    console.error('Erro ao parsear veiculacao', e);
    return [];
  }
};

const generateProtocol = (veiculacaoParsed: string[], departamento: string, deliveryAt: Date): string => {
  const veiculacaoInitials = veiculacaoParsed.length > 0 
    ? veiculacaoParsed.map((v: string) => v.charAt(0).toUpperCase()).join('') 
    : 'X';

  const deptInitials = departamento 
    ? departamento.substring(0, 3).toUpperCase() 
    : 'XXX';

  const dateStr = `${String(deliveryAt.getDate()).padStart(2, '0')}${String(deliveryAt.getMonth() + 1).padStart(2, '0')}${deliveryAt.getFullYear()}`;

  return `MFL-${veiculacaoInitials}-${deptInitials}-${dateStr}`;
};

export const createCard = async (req: Request, res: Response): Promise<void> => {
  console.log('DEBUG: createCard called');
  console.log('DEBUG: req.body:', req.body);
  
  const { 
    departamento, 
    email,
    tipoSolicitacao, 
    descricao, 
    veiculacao, 
    deliveryAt: deliveryAtRaw,
    dataEntrega,
    horarioEntrega,
    observacoes 
  } = req.body;

  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const veiculacaoParsed = parseVeiculacao(veiculacao);
  const deliveryAt = parseDeliveryAt(deliveryAtRaw, dataEntrega, horarioEntrega);
  if (!deliveryAt) {
    res.status(400).json({ error: 'deliveryAt é obrigatório' });
    return;
  }
  const protocolo = generateProtocol(veiculacaoParsed, departamento, deliveryAt);

  try {
    const stage =
      (await prisma.stage.findFirst({
        where: { boardKey: 'default', kind: 'TODO', active: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: { id: true },
      })) ??
      (await prisma.stage.findFirst({
        where: { boardKey: 'default', active: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: { id: true },
      }));

    if (!stage?.id) {
      res.status(500).json({ error: 'Stages não configuradas no banco' });
      return;
    }

    const newSolicitacao = await prisma.solicitacao.create({
      data: {
        departamento,
        email,
        protocolo,
        tipoSolicitacao,
        descricao,
        veiculacao: veiculacaoParsed,
        observacoes,
        arquivoUrl: arquivoUrl,
        deliveryAt,
        stageId: stage.id,
      }
    });

    await prisma.solicitacaoStageHistory.create({
      data: {
        solicitacaoId: newSolicitacao.id,
        fromStageId: null,
        toStageId: stage.id,
        changedAt: newSolicitacao.createdAt,
        changedById: null,
      },
    });

    // Enviar email de confirmação se houver email
    if (email) {
      // Não aguardamos o envio para não bloquear a resposta (fire and forget ou background job seria ideal)
      sendSolicitacaoEmail(email, newSolicitacao).catch(err => console.error('Falha no envio de email background:', err));
    }

    res.status(201).json(newSolicitacao);
  } catch (error) {
    console.error('Error creating card:', error);
    if (req.file) {
      try {
        const diskPath = (req.file as any).path || `uploads/${req.file.filename}`;
        if (fs.existsSync(diskPath)) {
          fs.unlinkSync(diskPath);
        }
      } catch (e) {
        console.error('Error removing uploaded file after create failure:', e);
      }
    }
    res.status(500).json({ error: 'Failed to create card' });
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

export const updateCardStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, stageId, archived, observacoes } = req.body as {
    status?: string;
    stageId?: string;
    archived?: boolean;
    observacoes?: string;
  };

  try {
    // Buscar card atual para verificar status anterior
    const currentCard = await prisma.solicitacao.findUnique({
      where: { id: String(id) }
    });

    if (!currentCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const updateData: any = {};
    const now = new Date();
    const actorId = (req as any).user?.userId ? String((req as any).user.userId) : null;
    
    const normalizedStageId = typeof stageId === 'string' && stageId.trim() ? stageId.trim() : null;
    const normalizedStatus = typeof status === 'string' && status.trim() ? status.trim() : null;

    let desiredStageId: string | null = null;
    let desiredStageName: string | null = null;
    let desiredStageKind: 'TODO' | 'IN_PROGRESS' | 'VALIDATION' | 'DONE' | null = null;

    const normalizedArchived = typeof archived === 'boolean' ? archived : null;
    if (normalizedArchived !== null) {
      if (normalizedArchived) {
        updateData.archivedAt = now;
      } else {
        updateData.archivedAt = null;
      }
    }

    if (normalizedStageId) {
      const stage = await prisma.stage.findUnique({
        where: { id: normalizedStageId },
        select: { id: true, name: true, kind: true },
      });
      if (stage) {
        desiredStageId = stage.id;
        desiredStageName = stage.name;
        desiredStageKind = stage.kind;
      }
    } else if (normalizedStatus) {
      const stageNameWanted = legacyStatusToStageName[String(normalizedStatus ?? 'todo')] ?? 'Novas solicitações';
      const stage = await prisma.stage.findFirst({
        where: { boardKey: 'default', name: stageNameWanted, active: true },
        select: { id: true, name: true, kind: true },
      });
      desiredStageId = stage?.id ?? currentCard.stageId ?? null;
      desiredStageName = stage?.name ?? null;
      desiredStageKind = stage?.kind ?? null;
    }

    if (desiredStageId) {
      updateData.stageId = desiredStageId;
    }
    if (!desiredStageId && normalizedArchived === null && typeof observacoes !== 'string') {
      return res.status(400).json({ error: 'Informe status ou stageId' });
    }

    if (typeof observacoes === 'string') {
      updateData.observacoes = observacoes;
    } else {
      let logText: string | null = null;

      if (normalizedArchived === true) {
        logText = 'Arquivado';
      } else if (normalizedArchived === false && currentCard.archivedAt) {
        logText = 'Solicitação reaberta.';
      } else if (desiredStageKind === 'DONE' && !currentCard.completedAt) {
        logText = 'Solicitação Concluída';
      } else if (desiredStageKind === 'IN_PROGRESS' && !currentCard.startedAt) {
        logText = 'Fazendo';
      } else if (desiredStageId && desiredStageId !== currentCard.stageId) {
        const fromStage = currentCard.stageId
          ? await prisma.stage.findUnique({ where: { id: currentCard.stageId }, select: { name: true } })
          : null;
        const fromName = fromStage?.name ?? '';
        const toName = desiredStageName ?? '';
        logText = toName ? `Etapa alterada: ${fromName} → ${toName}` : 'Etapa alterada.';
      }

      if (logText) {
        updateData.observacoes = appendLogLine(currentCard.observacoes, now, logText);
      }

      if (currentCard.email && logText === 'Solicitação reaberta.') {
        sendReaberturaEmail(currentCard.email, currentCard).catch((err) =>
          console.error('Falha no envio de email de reabertura:', err)
        );
      }
    }

    if (desiredStageKind === 'IN_PROGRESS') {
      if (!currentCard.startedAt) {
        updateData.startedAt = now;
      }
      if (!currentCard.firstRespondedAt) {
        updateData.firstRespondedAt = now;
      }
    } else if (desiredStageKind === 'DONE') {
      if (!currentCard.completedAt) {
        updateData.completedAt = now;
      }
    }

    const updatedSolicitacao = await prisma.solicitacao.update({
      where: { id: String(id) },
      data: updateData
    });

    if (desiredStageId && desiredStageId !== currentCard.stageId) {
      await prisma.solicitacaoStageHistory.create({
        data: {
          solicitacaoId: updatedSolicitacao.id,
          fromStageId: currentCard.stageId ?? null,
          toStageId: desiredStageId,
          changedAt: now,
          changedById: actorId,
        },
      });

      await prisma.solicitacaoActivity.create({
        data: {
          solicitacaoId: updatedSolicitacao.id,
          type: 'STAGE_CHANGE',
          message: desiredStageName ? `Etapa alterada para ${desiredStageName}` : 'Etapa alterada.',
          actorId,
        },
      });
    }

    if (!currentCard.completedAt && updateData.completedAt && updatedSolicitacao.email) {
      sendConclusaoEmail(updatedSolicitacao.email, updatedSolicitacao).catch((err) =>
        console.error('Falha no envio de email de conclusão:', err)
      );
    }

    if (!currentCard.startedAt && updateData.startedAt && updatedSolicitacao.email) {
      sendProducaoEmail(updatedSolicitacao.email, updatedSolicitacao).catch((err) =>
        console.error('Falha no envio de email de produção:', err)
      );
    }

    res.json(updatedSolicitacao);
  } catch (error) {
    console.error('Error updating card status:', error);
    res.status(500).json({ error: 'Failed to update card status' });
  }
};

export const getCardById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const card = await prisma.solicitacao.findUnique({
      where: { id: String(id) },
      include: { stage: true },
    });
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json(card);
  } catch (error) {
    console.error('Error fetching card details:', error);
    res.status(500).json({ error: 'Failed to fetch card details' });
  }
};
