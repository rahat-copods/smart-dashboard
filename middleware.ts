import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthenticated =
    request.cookies.get("auth_token")?.value === process.env.AUTH_TOKEN;

  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/api/login"
  ) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
