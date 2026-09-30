import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  hashManagerAccessKey,
  signPreAuthTicket,
  PREAUTH_COOKIE_NAME,
} from "@/lib/managerAccessKey";
import {
  getClientIp,
  isRateLimited,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from "@/lib/rateLimit";

const GENERIC_RATE_LIMIT_ERROR = "Too many attempts. Please try again later.";

/**
 * Checks if an error is a database connectivity/infrastructure error
 * (e.g. Neon cold starts, connection closed, timeouts, or missing schema objects).
 */
function isDbInfrastructureError(err: any): boolean {
  if (!err) return false;
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (err.name === "PrismaClientInitializationError") return true;

  const dbCodes = ["P1001", "P1002", "P1008", "P1017", "P2021", "P2022"];
  if (err instanceof Prisma.PrismaClientKnownRequestError && dbCodes.includes(err.code)) {
    return true;
  }
  if (err.name === "PrismaClientKnownRequestError" && dbCodes.includes(err.code)) {
    return true;
  }

  return false;
}

/**
 * Executes the key lookup with a single 800ms retry for transient
 * connection timeouts / cold-starts (P1001, P1002, P1017).
 */
async function findKeyRecordWithRetry(keyHash: string) {
  try {
    return await prisma.managerAccessKey.findUnique({
      where: { key_hash: keyHash },
    });
  } catch (err: any) {
    const isTransientConnectionError =
      (err instanceof Prisma.PrismaClientKnownRequestError &&
        ["P1001", "P1002", "P1017"].includes(err.code)) ||
      (err.name === "PrismaClientKnownRequestError" &&
        ["P1001", "P1002", "P1017"].includes(err.code)) ||
      err instanceof Prisma.PrismaClientInitializationError ||
      err.name === "PrismaClientInitializationError";

    if (isTransientConnectionError) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return await prisma.managerAccessKey.findUnique({
        where: { key_hash: keyHash },
      });
    }
    throw err;
  }
}

/**
 * POST /api/auth/manager-access-key/validate
 *
 * Step 1 of the Campaign Manager two-step authentication flow.
 * Validates the Admin-generated Access Key before allowing Discord login.
 *
 * Security:
 * - Server-side brute-force protection (5 failed attempts per 15 min per IP).
 * - Single canonical SHA-256 hash lookup in database.
 * - Clear, specific feedback for invalid, expired, revoked, or already redeemed codes.
 * - Sets an httpOnly, cryptographically signed pre-auth ticket cookie.
 * - Discriminated error responses: 503 for DB/infra issues (with retry), 500 for generic bugs.
 * - Infrastructure errors do NOT consume rate-limit attempts.
 */
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitKey = `mgr_key_ip:${clientIp}`;

  // 1. Enforce Server-Side Rate Limiting
  const rateLimit = isRateLimited(rateLimitKey);
  if (rateLimit.isLimited) {
    return NextResponse.json(
      { error: GENERIC_RATE_LIMIT_ERROR, valid: false },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds || 900),
        },
      }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawKey =
      body?.code ||
      body?.accessCode ||
      body?.accessKey ||
      body?.key ||
      body?.inviteCode;

    if (!rawKey || typeof rawKey !== "string" || rawKey.trim().length === 0) {
      const failure = recordFailedAttempt(rateLimitKey);
      if (failure.isLimited) {
        return NextResponse.json(
          { error: GENERIC_RATE_LIMIT_ERROR, valid: false },
          {
            status: 429,
            headers: { "Retry-After": String(failure.retryAfterSeconds || 900) },
          }
        );
      }
      return NextResponse.json(
        { error: "Please enter a manager access code.", valid: false },
        { status: 400 }
      );
    }

    // 2. Canonical single-path lookup: SHA-256 hash on normalized key
    const keyHash = hashManagerAccessKey(rawKey);

    // Query key record by unique key_hash with automatic retry for cold starts
    const keyRecord = await findKeyRecordWithRetry(keyHash);

    if (!keyRecord) {
      const failure = recordFailedAttempt(rateLimitKey);
      if (failure.isLimited) {
        return NextResponse.json(
          { error: GENERIC_RATE_LIMIT_ERROR, valid: false },
          {
            status: 429,
            headers: { "Retry-After": String(failure.retryAfterSeconds || 900) },
          }
        );
      }
      return NextResponse.json(
        { error: "Invalid manager access code", valid: false },
        { status: 400 }
      );
    }

    if (keyRecord.status === "USED") {
      const failure = recordFailedAttempt(rateLimitKey);
      if (failure.isLimited) {
        return NextResponse.json(
          { error: GENERIC_RATE_LIMIT_ERROR, valid: false },
          {
            status: 429,
            headers: { "Retry-After": String(failure.retryAfterSeconds || 900) },
          }
        );
      }
      return NextResponse.json(
        { error: "This manager access code has already been used", valid: false },
        { status: 400 }
      );
    }

    if (keyRecord.status === "REVOKED") {
      const failure = recordFailedAttempt(rateLimitKey);
      if (failure.isLimited) {
        return NextResponse.json(
          { error: GENERIC_RATE_LIMIT_ERROR, valid: false },
          {
            status: 429,
            headers: { "Retry-After": String(failure.retryAfterSeconds || 900) },
          }
        );
      }
      return NextResponse.json(
        { error: "This manager access code has been revoked", valid: false },
        { status: 400 }
      );
    }

    const now = new Date();
    if (keyRecord.expires_at && keyRecord.expires_at < now) {
      const failure = recordFailedAttempt(rateLimitKey);
      if (failure.isLimited) {
        return NextResponse.json(
          { error: GENERIC_RATE_LIMIT_ERROR, valid: false },
          {
            status: 429,
            headers: { "Retry-After": String(failure.retryAfterSeconds || 900) },
          }
        );
      }
      return NextResponse.json(
        { error: "This manager access code has expired", valid: false },
        { status: 400 }
      );
    }

    // 3. Key is valid! Reset rate limit counter for this IP
    recordSuccessfulAttempt(rateLimitKey);

    // 4. Issue a signed, short-lived pre-auth ticket to authorize subsequent Discord OAuth step
    const ticketToken = signPreAuthTicket(keyRecord.id);

    const isHttps =
      request.headers.get("x-forwarded-proto") === "https" ||
      request.url.startsWith("https://");

    const response = NextResponse.json({
      success: true,
      valid: true,
      ticket: ticketToken,
      preview: keyRecord.key_preview,
      message: "Manager access code verified.",
    });

    response.cookies.set(PREAUTH_COOKIE_NAME, ticketToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 10 * 60, // 10 minutes
      path: "/",
    });

    return response;
  } catch (err: any) {
    const requestId = crypto.randomUUID().slice(0, 8);
    console.error(`[ManagerAccessKey][${requestId}] Validation error:`, {
      name: err?.name,
      code: err?.code,
      meta: err?.meta,
      message: err?.message,
    });

    // Infrastructure / DB errors return 503 and do not burn rate limit attempts
    if (isDbInfrastructureError(err)) {
      return NextResponse.json(
        {
          valid: false,
          error: "Verification service is temporarily unavailable. Please try again in a moment.",
          requestId,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        valid: false,
        error: "A server error occurred during invitation verification. Please try again later.",
        requestId,
      },
      { status: 500 }
    );
  }
}
