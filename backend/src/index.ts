import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import bcrypt from 'bcryptjs';
import cardRoutes from './routes/cardRoutes';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import stageRoutes from './routes/stageRoutes';
import approvalRoutes from './routes/approvalRoutes';
import prisma from './config/database';

const myEnv = dotenv.config();
expand(myEnv);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Use routes
app.use('/api', cardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', stageRoutes);
app.use('/api/approval', approvalRoutes);

type StageSeed = {
  name: string;
  order: number;
  kind: 'TODO' | 'IN_PROGRESS' | 'VALIDATION' | 'DONE';
};

const DEFAULT_STAGES: StageSeed[] = [
  { name: 'Novas solicitações', order: 1, kind: 'TODO' },
  { name: 'Videos/Matérias', order: 2, kind: 'IN_PROGRESS' },
  { name: 'Cobertura de Eventos', order: 3, kind: 'IN_PROGRESS' },
  { name: 'Arte', order: 4, kind: 'IN_PROGRESS' },
  { name: 'Fazendo', order: 5, kind: 'IN_PROGRESS' },
  { name: 'A Aprovar', order: 6, kind: 'VALIDATION' },
  { name: 'Parado', order: 7, kind: 'IN_PROGRESS' },
  { name: 'Concluído', order: 8, kind: 'DONE' },
];

function ensurePrismaSchema() {
  const enabled = String(process.env.PRISMA_SYNC_ON_START || '').toLowerCase() === 'true';
  if (process.env.NODE_ENV === 'production' && !enabled) {
    return;
  }
  const skip = !enabled && process.env.NODE_ENV !== 'production';
  if (skip) {
    return;
  }
  console.log('Sincronizando schema Prisma com o banco (db push)...');
  const result = spawnSync('npx', ['prisma', 'db', 'push'], {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
    shell: true
  });
  if (result.error) {
    console.error('Erro ao rodar prisma db push:', result.error);
  } else if (result.status === 0) {
    console.log('Schema sincronizado.');
  } else {
    console.error(`prisma db push retornou status ${result.status}`);
  }
}

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

async function ensureDefaultStages() {
  const enabled = String(process.env.BOOTSTRAP_STAGES_ON_START || 'true').toLowerCase() === 'true';
  if (!enabled) return;

  for (const s of DEFAULT_STAGES) {
    const existing = await prisma.stage.findFirst({
      where: { boardKey: 'default', name: s.name },
      select: { id: true },
    });
    if (!existing) {
      await prisma.stage.create({
        data: {
          name: s.name,
          order: s.order,
          kind: s.kind,
          active: true,
          boardKey: 'default',
        },
      });
    }
  }
}

async function ensureAdminUser() {
  const enabled = String(process.env.SEED_ADMIN_ENABLED || 'true').toLowerCase() === 'true';
  if (!enabled) return;

  const name = String(process.env.SEED_ADMIN_NAME ?? '').trim();
  const email = String(process.env.SEED_ADMIN_EMAIL ?? '').trim();
  const passwordPlain = String(process.env.SEED_ADMIN_PASSWORD ?? '');
  const resetPassword = String(process.env.SEED_ADMIN_RESET_PASSWORD ?? '').toLowerCase() === 'true';

  if (!name || !email || !passwordPlain) return;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        roleEnum: 'ADMIN',
      },
    });
    return;
  }

  if (resetPassword) {
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    await prisma.user.update({
      where: { email },
      data: { name, role: 'admin', roleEnum: 'ADMIN', password: hashedPassword },
    });
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { name, role: 'admin', roleEnum: 'ADMIN' },
  });
}

ensurePrismaSchema();
Promise.resolve()
  .then(() => ensureDefaultStages())
  .then(() => ensureAdminUser())
  .catch((error) => {
    console.error('Erro ao inicializar dados padrão:', error);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  });
