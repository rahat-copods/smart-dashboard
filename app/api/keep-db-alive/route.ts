import { NextResponse } from "next/server";

import { executeQuery } from "@/lib/api/dbClient";

export async function GET() {
  const POSTGRES_URL = process.env.POSTGRES_URL;

  if (!POSTGRES_URL) {
    return new NextResponse("Missing POSTGRES_URL environment variable", {
      status: 500,
    });
  }

  // Use the connection string as is, similar to how it's done in dbClient usage
  // The existing dbClient.ts takes dbUrl. Pasing POSTGRES_URL directly.
  // Note: specific user routes append user-specific path, but for keep-alive generic connection should suffice
  // providing the base URL allows connecting to the default database.

  try {
    const result = await executeQuery(
      "SELECT doctor_id, first_name, last_name, specialization, years_experience FROM doctors LIMIT 5;",
      POSTGRES_URL,
    );

    if (result.error) {
      return NextResponse.json(
        { status: "error", message: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { status: "ok", message: "Database is active", data: result.data },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }
}
