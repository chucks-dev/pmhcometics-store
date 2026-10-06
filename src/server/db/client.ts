import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { env } from "../env";

const g = globalThis as unknown as { __pgPool?: Pool };

export const pool: Pool =
  g.__pgPool ??
  new Pool({
    connectionString: env.databaseUrl,
    max: 10,
    ssl: env.isProd ? { rejectUnauthorized: false } : undefined,
  });
if (!env.isProd) g.__pgPool = pool; // survive hot reloads in dev

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await pool.query<T>(text, params)).rows;
}

/** Run `fn` inside a transaction. Rolls back on any thrown error. */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
