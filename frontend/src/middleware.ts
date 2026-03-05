import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Route protection is handled client-side via Zustand + layout guards
  // This middleware handles basic redirects only
  const { pathname } = request.nextUrl;

  if (pathname === "/auth") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (pathname === "/vendor" && !pathname.startsWith("/vendor/")) {
    return NextResponse.redirect(new URL("/vendor/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth", "/vendor"],
};
