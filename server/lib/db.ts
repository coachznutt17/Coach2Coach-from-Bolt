import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.warn('No DATABASE_URL or SUPABASE_DB_URL found. Database operations will fail.');
}

export const pool = new Pool({
 connectionString,
ssl: false
 
});

export const query = async (text: string, params?: any[]) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};
