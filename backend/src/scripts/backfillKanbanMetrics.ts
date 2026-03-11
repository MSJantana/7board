import prisma from '../config/database';

type StageSeed = {
  name: string;
  order: number;
  kind: 'TODO' | 'IN_PROGRESS' | 'VALIDATION' | 'DONE';
  active: boolean;
  boardKey: string;
};

const STAGES: StageSeed[] = [
  { name: 'Novas solicitações', order: 1, kind: 'TODO', active: true, boardKey: 'default' },
  { name: 'Videos/Matérias', order: 2, kind: 'IN_PROGRESS', active: true, boardKey: 'default' },
  { name: 'Cobertura de Eventos', order: 3, kind: 'IN_PROGRESS', active: true, boardKey: 'default' },
  { name: 'Arte', order: 4, kind: 'IN_PROGRESS', active: true, boardKey: 'default' },
  { name: 'Fazendo', order: 5, kind: 'IN_PROGRESS', active: true, boardKey: 'default' },
  { name: 'A Aprovar', order: 6, kind: 'VALIDATION', active: true, boardKey: 'default' },
  { name: 'Parado', order: 7, kind: 'IN_PROGRESS', active: true, boardKey: 'default' },
  { name: 'Concluído', order: 8, kind: 'DONE', active: true, boardKey: 'default' },
];

const ensureStages = async () => {
  for (const s of STAGES) {
    const existing = await prisma.stage.findFirst({
      where: { boardKey: s.boardKey, name: s.name },
      select: { id: true },
    });
    if (!existing) {
      await prisma.stage.create({
        data: {
          name: s.name,
          order: s.order,
          kind: s.kind,
          active: s.active,
          boardKey: s.boardKey,
        },
      });
    }
  }

  const all = await prisma.stage.findMany({
    where: { boardKey: 'default' },
    select: { id: true, name: true },
  });
  return new Map(all.map((x) => [x.name, x.id]));
};

const main = async () => {
  const stageByName = await ensureStages();
  const defaultTodoId = stageByName.get('Novas solicitações') ?? null;

  const cards = await prisma.solicitacao.findMany({
    select: {
      id: true,
      createdAt: true,
      deliveryAt: true,
      stageId: true,
    },
  });

  let updated = 0;
  let createdHistory = 0;

  for (const card of cards) {
    const updateData: Record<string, unknown> = {};
    if (!card.stageId && defaultTodoId) {
      updateData.stageId = defaultTodoId;
    }

    if (!card.deliveryAt) {
      updateData.deliveryAt = card.createdAt;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.solicitacao.update({
        where: { id: card.id },
        data: updateData,
      });
      updated += 1;
    }

    const stageIdForHistory = (updateData.stageId as string | undefined) ?? card.stageId ?? null;
    if (stageIdForHistory) {
      const hasHistory = await prisma.solicitacaoStageHistory.findFirst({
        where: { solicitacaoId: card.id },
        select: { id: true },
      });
      if (!hasHistory) {
        await prisma.solicitacaoStageHistory.create({
          data: {
            solicitacaoId: card.id,
            fromStageId: null,
            toStageId: stageIdForHistory,
            changedAt: card.createdAt,
            changedById: null,
          },
        });
        createdHistory += 1;
      }
    }
  }

  console.log(JSON.stringify({ updated, createdHistory }));
};

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
