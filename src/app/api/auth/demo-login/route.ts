import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, COOKIE_NAME } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const role = body?.role;

    // Strict security: Demo login is permitted ONLY for Clippers preview.
    // Demo Admin and Demo Campaign Manager access has been completely removed.
    if (role && role !== "CLIPPER") {
      return NextResponse.json(
        { error: "Demo access for Admin and Campaign Manager has been removed. Only Clipper demo preview is available." },
        { status: 403 }
      );
    }

    const targetRole = UserRole.CLIPPER;

    // Find or create demo clipper user
    let user = await prisma.user.findFirst({
      where: { role: targetRole, email: "clipper@clipearn.com" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: "DemoClipper",
          email: "clipper@clipearn.com",
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
      redirectTo: "/clipper/dashboard",
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
