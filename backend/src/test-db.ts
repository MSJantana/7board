import mariadb from 'mariadb';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
const myEnv = dotenv.config();
expand(myEnv);

const dbUser = process.env.DATABASE_USER;
const dbPass = process.env.DATABASE_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.MYSQL_PORT;
const dbName = process.env.DATABASE_NAME;

console.log(`Config: Host=${dbHost}, Port=${dbPort}, User=${dbUser}`);

async function testConnection() {
    let pool;
    try {
        pool = mariadb.createPool({
            host: dbHost,
            port: Number(dbPort) || 3306,
            user: dbUser,
            password: dbPass,
            database: dbName,
            connectionLimit: 5,
            allowPublicKeyRetrieval: true
        });
        
        console.log('Pool created. Getting connection...');
        const conn = await pool.getConnection();
        console.log('Connected!');
        const rows = await conn.query("SELECT 1 as val");
        console.log(rows); 
        conn.release();
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        if (pool) await pool.end();
    }
}

(async () => {
    try {
        await testConnection();
    } catch (err) {
        console.error(err);
    }
})();
