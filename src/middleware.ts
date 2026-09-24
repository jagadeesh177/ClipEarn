import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("clipearn_session")?.value;

  // Redirect legacy /admin/login to Manager login with admin toggle active
  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/manager/login?admin=true", request.url));
  }
  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/manager/dashboard", request.url));
  }

  // 1. Clipper Protected Routes
  if (pathname.startsWith("/clipper")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Manager Protected Routes
  if (pathname.startsWith("/manager") && pathname !== "/manager/login") {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/manager/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/clipper/:path*", "/manager/:path*", "/admin/:path*", "/admin"],
};
