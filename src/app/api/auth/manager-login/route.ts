import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, verifyPassword, COOKIE_NAME, isAllowedAdminEmail, ensureRealAdmins } from "@/lib/auth";
import { UserRole } from "@prisma/client";
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
  const rateLimitKey = `mgr_login_ip:${clientIp}`;

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

    // Ensure real admin accounts are initialized in database
    await ensureRealAdmins();

    // 1. Exact Real Admin Authentication Gate
    if (isAllowedAdminEmail(normalizedEmail)) {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user || user.role !== UserRole.ADMIN || !user.password_hash) {
        recordFailedAttempt(rateLimitKey);
        return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        recordFailedAttempt(rateLimitKey);
        return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
      }

      recordSuccessfulAttempt(rateLimitKey);

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

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        redirectTo: "/manager/dashboard",
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
    recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Login failed" }, { status: 500 });
  }
}
