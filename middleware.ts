import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  // Define public API routes
  const publicApiRoutes = [
    "/api/login",
    "/api/register",
    "/api/forgot-password",
    "/api/reset-password",
    "/api/auth/check",
  ];

  // Check if the current path is a public route
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    publicApiRoutes.some((route) => pathname.startsWith(route));

  // Get authentication token
  const authToken = request.cookies.get("auth_token")?.value;
  const expectedToken = process.env.AUTH_TOKEN;

  // Verify authentication
  const isAuthenticated =
    authToken && expectedToken && authToken === expectedToken;

  // Allow access to public routes
  if (isPublicRoute) {
    // If user is authenticated and trying to access login, redirect to home
    if (isAuthenticated && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);

    // Add return URL as query parameter for redirect after login
    if (pathname !== "/") {
      loginUrl.searchParams.set("returnUrl", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
