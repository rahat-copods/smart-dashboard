import { Client } from "pg";

import { DbResult } from "./types";

/**
 * Build pg Client config from a URL. Supabase pooler URLs use username
 * "postgres.PROJECT_REF"; some parsers wrongly use that as the database name.
 * We parse the URL and set database from the path so it stays "postgres".
 */
function clientConfigFromUrl(
  dbUrl: string,
): ConstructorParameters<typeof Client>[0] {
  try {
    const url = new URL(dbUrl.replace(/^postgresql:\/\//, "https://"));
    const database = url.pathname
      ? url.pathname.slice(1).split("?")[0] || "postgres"
      : "postgres";

    return {
      connectionString: dbUrl,
      database: database || "postgres",
    };
  } catch {
    return { connectionString: dbUrl };
  }
}

export async function executeQuery(
  query: string,
  dbUrl: string,
): Promise<DbResult> {
  const client = new Client(clientConfigFromUrl(dbUrl));

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
