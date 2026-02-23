import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import mariadb from 'mariadb';
import path from 'path';
import { spawn } from 'child_process';

const myEnv = dotenv.config();
expand(myEnv);

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL não definida');
}

const parsed = new URL(url);

const host = parsed.hostname;
const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
const user = decodeURIComponent(parsed.username);
const password = decodeURIComponent(parsed.password);
const database = parsed.pathname.replace('/', '');

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

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await conn.query(
      `CREATE DATABASE \`${database}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci`
    );
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`Banco de dados "${database}" apagado e recriado com sucesso.`);
  } finally {
    if (conn) await conn.end();
    await pool.end();
  }

  const backendRoot = findBackendRoot();
  await runPrismaGenerate(backendRoot);
  await runPrismaDbPush(backendRoot);
  console.log('Schema Prisma aplicado com sucesso.');
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
  await execPrisma(['generate'], cwd);
}

async function runPrismaDbPush(cwd: string): Promise<void> {
  await execPrisma(['db', 'push'], cwd);
}

function execPrisma(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = prismaBin(cwd);
    const child = spawn(bin, args, {
      cwd,
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || '' },
      stdio: 'inherit',
      shell: false,
    });
    child.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`Prisma command failed with code ${code}`));
    });
    child.on('error', (err) => reject(err));
  });
}

main().catch((err) => {
  console.error('Erro ao dropar/criar banco:', err);
  process.exit(1);
});
