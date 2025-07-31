import { Pool } from 'pg';

export async function executeQuery(query: string, dbUrl: string): Promise<{ data: any[] | null; rowCount: number; error: string | null }> {
  console.log("query", query)
  const pool = new Pool({ connectionString: dbUrl });
  let client;
  try {
    client = await pool.connect();
    const queryResult = await client.query(query);
    const results = queryResult.rows;
    return { data: results, rowCount: results.length, error: null };
  } catch (error: any) {
    return { data: null, rowCount: 0, error: error.message };
  } finally {
    if (client) client.release();
    await pool.end();
  }
}