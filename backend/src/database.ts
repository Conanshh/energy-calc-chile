import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Verificamos si tenemos la URL completa (Neon/Nube) o datos sueltos (Local)
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // Para la nube:
  ssl: connectionString?.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

pool.on('connect', () => {
  console.log('✅ Conexión establecida con PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de la DB', err);
});