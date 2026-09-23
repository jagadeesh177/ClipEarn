import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashManagerAccessKey,
  normalizeManagerAccessKey,
  signPreAuthTicket,
  PREAUTH_COOKIE_NAME,
} from "@/lib/managerAccessKey";
import {
  getClientIp,
  isRateLimited,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from "@/lib/rateLimit";

const GENERIC_INVALID_ERROR = "Invalid or expired manager access code.";
const GENERIC_RATE_LIMIT_ERROR = "Too many attempts. Please try again later.";

/**
 * POST /api/auth/manager-access-key/validate
 *
 * Step 1 of the Campaign Manager two-step authentication flow.
 * Validates the Admin-generated Access Key before allowing Discord login.
 *
 * Security:
 * - Server-side brute-force protection (5 failed attempts per 15 min per IP).
 * - SHA-256 hash lookup in database (plaintext is never stored or queried).
 * - Sets an httpOnly, cryptographically signed pre-auth ticket cookie.
 * - Uniform generic error responses to prevent enumeration attacks.
 */
export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  // 1. Enforce Server-Side Rate Limiting
  const rateLimit = isRateLimited(`mgr_key_ip:${clientIp}`);
  if (rateLimit.isLimited) {
    return NextResponse.json(
      { error: GENERIC_RATE_LIMIT_ERROR },
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
    const rawKey = body?.accessKey || body?.key;

    if (!rawKey || typeof rawKey !== "string" || rawKey.trim().length === 0) {
      const failure = recordFailedAttempt(`mgr_key_ip:${clientIp}`);
      if (failure.isLimited) {
        return NextResponse.json(
          { error: GENERIC_RATE_LIMIT_ERROR, valid: false },
          {
            status: 429,
            headers: {
              "Retry-After": String(failure.retryAfterSeconds || 900),
            },
          }
        );
      }
      return NextResponse.json(
        { error: GENERIC_INVALID_ERROR, valid: false },
        { status: 400 }
      );
    }

    const normalized = normalizeManagerAccessKey(rawKey);
    const keyHash = hashManagerAccessKey(rawKey);

    // 2. Query key record by hash (or normalized key if legacy)
    const keyRecord = await prisma.managerAccessKey.findFirst({
      where: {
        OR: [
          { key_hash: keyHash },
          { key_hash: normalized },
        ],
      },
    });

    const now = new Date();
    const isExpired = keyRecord?.expires_at ? keyRecord.expires_at < now : false;
    const isValid = keyRecord && keyRecord.status === "ACTIVE" && !isExpired;

    if (!isValid) {
      const failure = recordFailedAttempt(`mgr_key_ip:${clientIp}`);
      if (failure.isLimited) {
        return NextResponse.json(
          { error: GENERIC_RATE_LIMIT_ERROR, valid: false },
          {
            status: 429,
            headers: {
              "Retry-After": String(failure.retryAfterSeconds || 900),
            },
          }
        );
      }
      return NextResponse.json(
        { error: GENERIC_INVALID_ERROR, valid: false },
        { status: 400 }
      );
    }

    // 3. Key is valid! Reset rate limit counter for this IP
    recordSuccessfulAttempt(`mgr_key_ip:${clientIp}`);

    // 4. Issue a signed, short-lived pre-auth ticket to authorize the subsequent Discord OAuth step
    const ticketToken = signPreAuthTicket(keyRecord.id);

    const isHttps =
      request.headers.get("x-forwarded-proto") === "https" ||
      request.url.startsWith("https://");

    const response = NextResponse.json({
      success: true,
      valid: true,
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
    const failure = recordFailedAttempt(`mgr_key_ip:${clientIp}`);
    if (failure.isLimited) {
      return NextResponse.json(
        { error: GENERIC_RATE_LIMIT_ERROR, valid: false },
        {
          status: 429,
          headers: {
            "Retry-After": String(failure.retryAfterSeconds || 900),
          },
        }
      );
    }
    return NextResponse.json(
      { error: GENERIC_INVALID_ERROR, valid: false },
      { status: 400 }
    );
  }
}
