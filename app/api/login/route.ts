import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    // Environment variables
    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;
    const authToken = process.env.AUTH_TOKEN;

    // Check server configuration
    if (!authToken || !validUsername || !validPassword) {
      console.error("Missing required environment variables");

      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Authenticate user
    if (username === validUsername && password === validPassword) {
      const response = NextResponse.json(
        { success: true, message: "Login successful" },
        { status: 200 },
      );

      // Set secure cookie
      response.cookies.set("auth_token", authToken, {
        httpOnly: true,
        secure: false, // false for HTTP
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
        path: "/",
      });

      return response;
    }

    // Invalid credentials - add small delay to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  } catch (error) {
    console.error("Login API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
