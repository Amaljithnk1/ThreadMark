import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { env } from "./env.js";

export const pool = new Pool({ connectionString: env.DATABASE_URL });
export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return pool.query<T>(text, values);
}
export async function transaction<T>(operation: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try { await client.query("BEGIN"); const result = await operation(client); await client.query("COMMIT"); return result; }
  catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
