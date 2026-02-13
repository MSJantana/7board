import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSolicitacaoEmail, sendConclusaoEmail, sendReaberturaEmail } from '../services/emailService';

export const getCards = async (req: Request, res: Response) => {
  try {
    const solicitacoes = await prisma.solicitacao.findMany({
      orderBy: {
        createdAt: 'desc'
      }
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

const generateProtocol = (veiculacaoParsed: string[], departamento: string, dataEntrega: string): string => {
  const veiculacaoInitials = veiculacaoParsed.length > 0 
    ? veiculacaoParsed.map((v: string) => v.charAt(0).toUpperCase()).join('') 
    : 'X';

  const deptInitials = departamento 
    ? departamento.substring(0, 3).toUpperCase() 
    : 'XXX';

  let dateStr = '';
  if (dataEntrega) {
    const parts = dataEntrega.split('-'); // YYYY-MM-DD
    dateStr = parts.length === 3 
      ? `${parts[2]}${parts[1]}${parts[0]}` 
      : dataEntrega.replaceAll(/\D/g, '');
  } else {
     const now = new Date();
     dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
  }

  return `7BD-${veiculacaoInitials}-${deptInitials}-${dateStr}`;
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
    dataEntrega,
    horarioEntrega,
    observacoes 
  } = req.body;

  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const veiculacaoParsed = parseVeiculacao(veiculacao);
  const protocolo = generateProtocol(veiculacaoParsed, departamento, dataEntrega);

  try {
    const newSolicitacao = await prisma.solicitacao.create({
      data: {
        departamento,
        email,
        protocolo,
        tipoSolicitacao,
        descricao,
        veiculacao: veiculacaoParsed,
        dataEntrega,
        horarioEntrega,
        observacoes,
        arquivoUrl: arquivoUrl,
        status: 'todo'
      }
    });

    // Enviar email de confirmação se houver email
    if (email) {
      // Não aguardamos o envio para não bloquear a resposta (fire and forget ou background job seria ideal)
      sendSolicitacaoEmail(email, newSolicitacao).catch(err => console.error('Falha no envio de email background:', err));
    }

    res.status(201).json(newSolicitacao);
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ error: 'Failed to create card' });
  }
};

export const updateCardStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Buscar card atual para verificar status anterior
    const currentCard = await prisma.solicitacao.findUnique({
      where: { id: String(id) }
    });

    if (!currentCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const updateData: any = { status };
    const now = new Date();

    // Lógica de Reabertura (Done -> Todo)
    if (currentCard.status === 'done' && status === 'todo') {
      const logMessage = `\n[${now.toLocaleString('pt-BR')}] Solicitação reaberta.`;
      updateData.observacoes = (currentCard.observacoes || '') + logMessage;
      
      // Enviar email de reabertura
      if (currentCard.email) {
        sendReaberturaEmail(currentCard.email, currentCard)
          .catch(err => console.error('Falha no envio de email de reabertura:', err));
      }
      console.log(`Solicitação ${id} reaberta.`);
    }

    if (status === 'in-progress') {
      updateData.startedAt = now;
    } else if (status === 'done') {
      updateData.completedAt = now;
    } else if (status === 'archived') {
      updateData.archivedAt = now;
    }

    const updatedSolicitacao = await prisma.solicitacao.update({
      where: { id: String(id) },
      data: updateData
    });

    if (status === 'done' && updatedSolicitacao.email) {
       sendConclusaoEmail(updatedSolicitacao.email, updatedSolicitacao)
         .catch(err => console.error('Falha no envio de email de conclusão:', err));
    }

    res.json(updatedSolicitacao);
  } catch (error) {
    console.error('Error updating card status:', error);
    res.status(500).json({ error: 'Failed to update card status' });
  }
};
