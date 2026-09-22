import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, COOKIE_NAME } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { role } = await request.json();

    const targetRole = role === "MANAGER" ? UserRole.MANAGER : role === "ADMIN" ? UserRole.ADMIN : UserRole.CLIPPER;

    // Find or create demo user
    let user = await prisma.user.findFirst({
      where: { role: targetRole },
    });

    if (!user) {
      const username = targetRole === UserRole.MANAGER ? "DemoManager" : targetRole === UserRole.ADMIN ? "DemoAdmin" : "DemoClipper";
      const email = targetRole === UserRole.MANAGER ? "manager@clipearn.com" : targetRole === UserRole.ADMIN ? "admin@clipearn.com" : "clipper@clipearn.com";

      user = await prisma.user.create({
        data: {
          username,
          email,
          role: targetRole,
          referral_code: `DEMO${Math.floor(1000 + Math.random() * 9000)}`,
        },
      });
    }

    const token = signSessionToken({
      userId: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      redirectTo: user.role === UserRole.CLIPPER ? "/clipper/dashboard" : "/manager/dashboard",
    });

    const isHttps = request.headers.get("x-forwarded-proto") === "https" || request.url.startsWith("https://");

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Demo login failed" }, { status: 500 });
  }
}
