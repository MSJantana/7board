import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import mariadb from 'mariadb';
import path from 'node:path';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';

const myEnv = dotenv.config();
expand(myEnv);

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL não definida');
}

const parsed = new URL(url);

const host = parsed.hostname;
const port = parsed.port ? Number.parseInt(parsed.port, 10) : 3306;
const user = decodeURIComponent(parsed.username);
const password = decodeURIComponent(parsed.password);
const database = parsed.pathname.replace('/', '');

type StageSeed = {
  name: string;
  order: number;
  kind: 'TODO' | 'IN_PROGRESS' | 'VALIDATION' | 'DONE';
};

const STAGES: StageSeed[] = [
  { name: 'Novas solicitações', order: 1, kind: 'TODO' },
  { name: 'Videos/Matérias', order: 2, kind: 'IN_PROGRESS' },
  { name: 'Cobertura de Eventos', order: 3, kind: 'IN_PROGRESS' },
  { name: 'Arte', order: 4, kind: 'IN_PROGRESS' },
  { name: 'Fazendo', order: 5, kind: 'IN_PROGRESS' },
  { name: 'A Aprovar', order: 6, kind: 'VALIDATION' },
  { name: 'Parado', order: 7, kind: 'IN_PROGRESS' },
  { name: 'Concluído', order: 8, kind: 'DONE' },
];

async function main() {
  if (!database) {
    throw new Error('Nome do banco não encontrado em DATABASE_URL');
  }

  const pool = mariadb.createPool({
    host,
    port,
    user,
    password,
    connectionLimit: 5
  });

  let conn;
  try {
    conn = await pool.getConnection();

    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci`
    );

    const tables = (await conn.query(
      `SELECT table_name AS tableName
       FROM information_schema.tables
       WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [database]
    )) as Array<{ tableName: string }>;

    const views = (await conn.query(
      `SELECT table_name AS viewName
       FROM information_schema.views
       WHERE table_schema = ?`,
      [database]
    )) as Array<{ viewName: string }>;

    const keepTables = new Set(['User', 'user']);
    const dropTables = tables.map((t) => t.tableName).filter((t) => !keepTables.has(t));

    await conn.query(`USE \`${database}\``);
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const view of views.map((v) => v.viewName)) {
      await conn.query(`DROP VIEW IF EXISTS \`${view}\``);
    }

    for (const table of dropTables) {
      await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`Banco "${database}" limpo com sucesso (mantido: User).`);
  } finally {
    if (conn) await conn.end();
    await pool.end();
  }

  const backendRoot = findBackendRoot();
  await runPrismaGenerate(backendRoot);
  await runPrismaDbPush(backendRoot);
  await seedStages();
  await seedAdminUser();
  console.log('Schema Prisma aplicado com sucesso.');
}

async function seedStages() {
  const pool = mariadb.createPool({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 2,
  });

  let conn;
  try {
    conn = await pool.getConnection();
    for (const s of STAGES) {
      await conn.query(
        `INSERT INTO \`Stage\` (\`id\`, \`name\`, \`order\`, \`kind\`, \`active\`, \`boardKey\`, \`createdAt\`, \`updatedAt\`)
         SELECT UUID(), ?, ?, ?, true, 'default', NOW(3), NOW(3)
         WHERE NOT EXISTS (
           SELECT 1 FROM \`Stage\` WHERE \`boardKey\` = 'default' AND \`name\` = ?
         )`,
        [s.name, s.order, s.kind, s.name]
      );
    }
  } finally {
    if (conn) await conn.end();
    await pool.end();
  }
}

async function seedAdminUser() {
  const name = String(process.env.SEED_ADMIN_NAME ?? '').trim();
  const email = String(process.env.SEED_ADMIN_EMAIL ?? '').trim();
  const passwordPlain = String(process.env.SEED_ADMIN_PASSWORD ?? '');
  const resetPassword = String(process.env.SEED_ADMIN_RESET_PASSWORD ?? '').toLowerCase() === 'true';

  if (!name || !email || !passwordPlain) {
    return;
  }

  const hashedPassword = await bcrypt.hash(passwordPlain, 10);

  const pool = mariadb.createPool({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 2,
  });

  let conn;
  try {
    conn = await pool.getConnection();

    const existing = (await conn.query('SELECT id FROM `User` WHERE `email` = ? LIMIT 1', [email])) as Array<{ id: string }>;

    if (existing.length === 0) {
      await conn.query(
        `INSERT INTO \`User\` (\`id\`, \`name\`, \`email\`, \`password\`, \`role\`, \`roleEnum\`, \`createdAt\`, \`updatedAt\`)
         VALUES (UUID(), ?, ?, ?, 'admin', 'ADMIN', NOW(3), NOW(3))`,
        [name, email, hashedPassword]
      );
      return;
    }

    if (resetPassword) {
      await conn.query(
        `UPDATE \`User\`
         SET \`name\` = ?, \`role\` = 'admin', \`roleEnum\` = 'ADMIN', \`password\` = ?, \`updatedAt\` = NOW(3)
         WHERE \`email\` = ?`,
        [name, hashedPassword, email]
      );
      return;
    }

    await conn.query(
      `UPDATE \`User\`
       SET \`name\` = ?, \`role\` = 'admin', \`roleEnum\` = 'ADMIN', \`updatedAt\` = NOW(3)
       WHERE \`email\` = ?`,
      [name, email]
    );
  } finally {
    if (conn) await conn.end();
    await pool.end();
  }
}

function findBackendRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(__dirname, '..', '..'),
  ];
  for (const cwd of candidates) {
    if (cwd.toLowerCase().endsWith(path.sep + 'backend') || cwd.toLowerCase().includes(`${path.sep}backend`)) {
      return cwd;
    }
  }
  return process.cwd();
}

function prismaBin(cwd: string): string {
  const isWin = process.platform === 'win32';
  const bin = path.join(cwd, 'node_modules', '.bin', isWin ? 'prisma.cmd' : 'prisma');
  return bin;
}

async function runPrismaGenerate(cwd: string): Promise<void> {
  await execPrismaWithRetry(['generate'], cwd);
}

async function runPrismaDbPush(cwd: string): Promise<void> {
  await execPrismaWithRetry(['db', 'push'], cwd);
}

function execPrisma(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = prismaBin(cwd);
    const child = spawn(bin, args, {
      cwd,
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || '' },
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`Prisma command failed with code ${code}`));
    });
    child.on('error', (err) => reject(err));
  });
}

async function cleanupPrismaWindowsTmp(cwd: string) {
  if (process.platform !== 'win32') return;
  const dir = path.join(cwd, 'node_modules', '.prisma', 'client');
  try {
    const entries = await fs.readdir(dir);
    const tmpFiles = entries.filter((name) => name.startsWith('query_engine-windows.dll.node.tmp'));
    await Promise.all(
      tmpFiles.map((name) =>
        fs.unlink(path.join(dir, name)).catch(() => undefined)
      )
    );
  } catch {
    return;
  }
}

async function execPrismaWithRetry(args: string[], cwd: string) {
  const maxAttempts = process.platform === 'win32' && args[0] === 'generate' ? 3 : 1;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await cleanupPrismaWindowsTmp(cwd);
    try {
      await execPrisma(args, cwd);
      return;
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
    }
  }

  throw lastError;
}

main().catch((err) => {
  console.error('Erro ao dropar/criar banco:', err);
  process.exit(1);
});
