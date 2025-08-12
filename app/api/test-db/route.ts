import { NextResponse } from "next/server";
import { Client } from "pg";

export const runtime = "nodejs";

export async function GET() {
  const dbUrl = process.env.POSTGRES_URL;

  if (!dbUrl) {
    return NextResponse.json(
      { error: "POSTGRES_URL is not set in environment" },
      { status: 500 },
    );
  }

  let result: any;

  try {
    const client = new Client({ connectionString: dbUrl });

    await client.connect();

    // Minimal query to check connectivity
    const res = await client.query("SELECT NOW() as current_time");

    result = res.rows[0];

    await client.end();
  } catch (err: any) {
    return NextResponse.json(
      { error: `DB connection failed: ${err.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, result });
}
