import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import mariadb from 'mariadb';

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
}

main().catch((err) => {
  console.error('Erro ao dropar/criar banco:', err);
  process.exit(1);
});

