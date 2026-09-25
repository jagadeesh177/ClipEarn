import { NextResponse } from "next/server";
import crypto from "crypto";
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

const GENERIC_RATE_LIMIT_ERROR = "Too many attempts. Please try again later.";

/**
 * POST /api/auth/manager-access-key/validate
 *
 * Step 1 of the Campaign Manager two-step authentication flow.
 * Validates the Admin-generated Access Key before allowing Discord login.
 *
 * Security:
 * - Server-side brute-force protection (5 failed attempts per 15 min per IP).
 * - SHA-256 hash lookup in database (plaintext is never stored).
 * - Clear, specific feedback for invalid, expired, revoked, or already redeemed codes.
 * - Sets an httpOnly, cryptographically signed pre-auth ticket cookie.
 * - Secure server error logging without leaking secrets.
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
    const rawKey = body?.accessKey || body?.key;

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
        { error: "Please enter a valid invitation code.", valid: false },
        { status: 400 }
      );
    }

    const normalized = normalizeManagerAccessKey(rawKey);
    const keyHash = hashManagerAccessKey(rawKey);

    const hashesToCheck = [
      keyHash,
      crypto.createHash("sha256").update(normalized).digest("hex"),
      crypto.createHash("sha256").update(rawKey.trim()).digest("hex"),
      crypto.createHash("sha256").update(rawKey.trim().toUpperCase()).digest("hex"),
    ];
    const uniqueHashes = Array.from(new Set(hashesToCheck));

    // 2. Query key record by hash or normalized key
    const keyRecord = await prisma.managerAccessKey.findFirst({
      where: {
        OR: [
          ...uniqueHashes.map((h) => ({ key_hash: h })),
          { key_hash: normalized },
        ],
      },
    });

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
        { error: "Invalid invitation code. Please check the code and try again.", valid: false },
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
        { error: "This invitation code has already been redeemed.", valid: false },
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
        { error: "This invitation code has been revoked by an administrator.", valid: false },
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
        { error: "This invitation code has expired. Please request a new code from an administrator.", valid: false },
        { status: 400 }
      );
    }

    // 3. Key is valid! Reset rate limit counter for this IP
    recordSuccessfulAttempt(rateLimitKey);

    // 4. Issue a signed, short-lived pre-auth ticket to authorize the subsequent Discord OAuth step
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
    console.error("Manager access key validation error:", err?.message || err);
    return NextResponse.json(
      { error: "A server error occurred during invitation verification. Please try again later.", valid: false },
      { status: 500 }
    );
  }
}
