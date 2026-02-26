import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import cardRoutes from './routes/cardRoutes';

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

function ensurePrismaSchema() {
  const skip = String(process.env.PRISMA_SYNC_ON_START || '').toLowerCase() === 'false';
  if (skip) {
    console.log('PRISMA_SYNC_ON_START=false: pulando prisma db push');
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

ensurePrismaSchema();
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
