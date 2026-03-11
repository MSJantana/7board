export type Stage = {
  id: string;
  name: string;
  order: number;
  kind?: 'TODO' | 'IN_PROGRESS' | 'VALIDATION' | 'DONE';
  active?: boolean;
  boardKey?: string | null;
};

export const getStageIdByName = (stages: Stage[], name: string) => {
  return stages.find((s) => s.name === name)?.id ?? null;
};

export const getDefaultStageIds = (stages: Stage[]) => {
  const todoId = getStageIdByName(stages, 'Novas solicitações');
  const doingId = getStageIdByName(stages, 'Fazendo');
  const doneId = getStageIdByName(stages, 'Concluído');
  return { todoId, doingId, doneId };
};

