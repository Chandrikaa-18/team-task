import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

function shouldUseSsl(databaseUrl) {
  if (!databaseUrl) return false;
  return config.isProduction || databaseUrl.includes('railway') || databaseUrl.includes('rlwy.net');
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: shouldUseSsl(config.databaseUrl) ? { rejectUnauthorized: false } : false
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
