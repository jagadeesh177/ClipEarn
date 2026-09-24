import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, verifyPassword, COOKIE_NAME, isAllowedAdminEmail, ensureRealAdmins } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Ensure real admin accounts are initialized in database
    await ensureRealAdmins();

    // 1. Exact Real Admin Authentication Gate
    if (isAllowedAdminEmail(normalizedEmail)) {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user || user.role !== UserRole.ADMIN || !user.password_hash) {
        return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
      }

      const token = signSessionToken({
        userId: user.id,
        role: user.role,
        username: user.username,
        email: user.email,
      });

      await logAuditEvent({
        actorId: user.id,
        action: "ADMIN_LOGIN",
        targetType: "USER",
        targetId: user.id,
      });

      const requestedPortal = body.portal === "manager" ? "manager" : "admin";
      const redirectTo = requestedPortal === "manager" ? "/manager/dashboard" : "/admin/dashboard";

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        redirectTo,
      });

      const isHttps =
        request.headers.get("x-forwarded-proto") === "https" ||
        request.url.startsWith("https://");

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    // 2. Non-admin or unrecognized accounts attempting Admin login
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Login failed" }, { status: 500 });
  }
}
