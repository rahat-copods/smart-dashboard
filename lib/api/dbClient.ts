import { Client } from "pg";

import { DbResult } from "./types";

export async function executeQuery(
  query: string,
  dbUrl: string,
): Promise<DbResult> {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    const queryResult = await client.query(query);
    const results = queryResult.rows;

    return { data: results, rowCount: results.length, error: null };
  } catch (error: any) {
    return { data: null, rowCount: 0, error: error.message };
  } finally {
    await client.end();
  }
}
