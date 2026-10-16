import { Pool } from "pg";

const globalForPg = globalThis as unknown as { slPool?: Pool };

function makePool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
}

export const pool: Pool = globalForPg.slPool ?? makePool();
if (process.env.NODE_ENV !== "production") globalForPg.slPool = pool;

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query(text, params as unknown[]);
  return res.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
