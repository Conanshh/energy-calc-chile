import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// El Pool gestiona múltiples conexiones de forma eficiente
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

pool.on('connect', () => {
  console.log('Conectado a la base de datos PostgreSQL 🐘');
});