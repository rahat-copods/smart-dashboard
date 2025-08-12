export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const authToken = request.cookies.get("auth_token")?.value;
    const expectedToken = process.env.AUTH_TOKEN;

    // Check if token exists and matches
    if (!authToken || !expectedToken || authToken !== expectedToken) {
      return NextResponse.json(
        { error: "Unauthorized", authenticated: false },
        { status: 401 },
      );
    }

    // Token is valid
    return NextResponse.json(
      { authenticated: true, message: "Authenticated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Auth check error:", error);

    return NextResponse.json(
      { error: "Internal server error", authenticated: false },
      { status: 500 },
    );
  }
}
