import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, verifyPassword, COOKIE_NAME, isAllowedAdminEmail, ensureRealAdmins } from "@/lib/auth";
import { UserRole, UserStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import {
  getClientIp,
  isRateLimited,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from "@/lib/rateLimit";

const GENERIC_RATE_LIMIT_ERROR = "Too many attempts. Please try again later.";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitKey = `admin_login_ip:${clientIp}`;

  const rateLimit = isRateLimited(rateLimitKey);
  if (rateLimit.isLimited) {
    return NextResponse.json(
      { error: GENERIC_RATE_LIMIT_ERROR },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds || 900) },
      }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Ensure real admin accounts exist in database
    await ensureRealAdmins();

    // 1. Exact Real Admin Authorization Gate
    if (!isAllowedAdminEmail(normalizedEmail)) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.role !== UserRole.ADMIN || !user.password_hash) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED) {
      return NextResponse.json(
        { error: `Account suspended: ${user.suspension_reason || "Contact security."}` },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    }

    recordSuccessfulAttempt(rateLimitKey);

    const token = signSessionToken({
      userId: user.id,
      role: UserRole.ADMIN,
      username: user.username,
      email: user.email,
    });

    await logAuditEvent({
      actorId: user.id,
      action: "ADMIN_LOGIN",
      targetType: "USER",
      targetId: user.id,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: UserRole.ADMIN,
      },
      redirectTo: "/admin/dashboard",
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
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Login failed" }, { status: 500 });
  }
}
