import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  // Hardcoded credentials from environment variables
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;
  const authToken = process.env.AUTH_TOKEN;

  // Check if authToken is defined
  if (!authToken) {
    return NextResponse.json(
      { error: "Server configuration error: AUTH_TOKEN is missing" },
      { status: 500 },
    );
  }

  if (username === validUsername && password === validPassword) {
    // Create response and set auth cookie
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set("auth_token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 24 * 7, // 7 days
    });

    return response;
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
