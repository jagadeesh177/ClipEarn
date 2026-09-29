import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("clipearn_session")?.value;

  // Handle root /admin
  if (pathname === "/admin") {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 1. Admin Routes (/admin/*)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // 2. Manager Routes (/manager/*)
  if (pathname.startsWith("/manager") && pathname !== "/manager/login") {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/manager/login", request.url));
    }
  }

  // 3. Clipper Protected Routes (/clipper/*)
  if (pathname.startsWith("/clipper")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/clipper/:path*", "/manager/:path*", "/admin/:path*", "/admin"],
};
