import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, CampaignStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { normalizeAccessCode, hashAccessCode } from "@/lib/campaignAccess";
import {
  getClientIp,
  isRateLimited,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from "@/lib/rateLimit";

const GENERIC_INVALID_ERROR = "Invalid or expired campaign access code.";
const GENERIC_RATE_LIMIT_ERROR = "Too many attempts. Please try again later.";

/**
 * POST /api/manager/access-code/redeem
 *
 * Secure Campaign Manager Access Code validation & redemption endpoint.
 *
 * Security features:
 * 1. Server-side brute force / rate-limit protection (5 failed attempts per 15 min per IP/User).
 * 2. Cryptographic SHA-256 hash lookup so plaintext codes are never stored in DB.
 * 3. Constant generic error messages without enumeration leakage.
 * 4. Automatic expiration check and revocation/duplicate prevention.
 * 5. Plaintext codes are never logged in audit trails.
 */
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  let userId: string | null = null;

  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    userId = user.id;

    // 1. Check Rate Limiting for IP and User Account
    const ipLimit = isRateLimited(`ip:${clientIp}`);
    const userLimit = isRateLimited(`user:${user.id}`);

    if (ipLimit.isLimited || userLimit.isLimited) {
      const retryAfter = Math.max(ipLimit.retryAfterSeconds, userLimit.retryAfterSeconds, 60);
      return NextResponse.json(
        { error: GENERIC_RATE_LIMIT_ERROR },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawCode = body?.code;

    if (!rawCode || typeof rawCode !== "string" || rawCode.trim().length === 0) {
      recordFailedAttempt(`ip:${clientIp}`);
      recordFailedAttempt(`user:${user.id}`);
      return NextResponse.json(
        { error: GENERIC_INVALID_ERROR },
        { status: 400 }
      );
    }

    const normalizedCode = normalizeAccessCode(rawCode);
    const codeHash = hashAccessCode(rawCode);

    // 2. Query code record by SHA-256 hash (or legacy plaintext if existing)
    const accessCode = await prisma.campaignAccessCode.findFirst({
      where: {
        OR: [
          { code: codeHash },
          { code: normalizedCode },
        ],
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            brand_name: true,
            status: true,
          },
        },
      },
    });

    // 3. Validate existence, active status, expiration, and campaign validity
    const now = new Date();
    const isExpired = accessCode?.expires_at ? accessCode.expires_at < now : false;
    const isValid =
      accessCode &&
      accessCode.status === "ACTIVE" &&
      !isExpired &&
      accessCode.campaign &&
      accessCode.campaign.status !== CampaignStatus.CANCELLED;

    if (!isValid) {
      recordFailedAttempt(`ip:${clientIp}`);
      recordFailedAttempt(`user:${user.id}`);
      return NextResponse.json(
        { error: GENERIC_INVALID_ERROR },
        { status: 400 }
      );
    }

    // 4. Check if manager already has access to this campaign
    const existingManagerAccess = await prisma.campaignAccessCode.findFirst({
      where: {
        campaign_id: accessCode.campaign_id,
        redeemed_by: user.id,
        status: "REDEEMED",
      },
    });

    if (existingManagerAccess) {
      // Do not count as a brute-force violation if manager already owns it,
      // but reject with generic invalid error to prevent account probing
      return NextResponse.json(
        { error: GENERIC_INVALID_ERROR },
        { status: 400 }
      );
    }

    // 5. Grant access: atomically mark as REDEEMED
    const updated = await prisma.campaignAccessCode.update({
      where: { id: accessCode.id },
      data: {
        status: "REDEEMED",
        redeemed_by: user.id,
        redeemed_at: new Date(),
      },
      include: {
        campaign: true,
      },
    });

    // 6. Reset rate limit counters on successful legitimate authorization
    recordSuccessfulAttempt(`ip:${clientIp}`);
    recordSuccessfulAttempt(`user:${user.id}`);

    // 7. Log non-sensitive audit event (masked preview only)
    await logAuditEvent({
      actorId: user.id,
      action: "CAMPAIGN_ACCESS_CODE_REDEEMED",
      targetType: "CAMPAIGN",
      targetId: accessCode.campaign_id,
      newValue: {
        campaign_name: accessCode.campaign.name,
        code_preview: accessCode.code_preview,
        manager_username: user.username,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Access granted to campaign: ${accessCode.campaign.name}`,
      campaign: {
        id: updated.campaign.id,
        name: updated.campaign.name,
        brand_name: updated.campaign.brand_name,
        status: updated.campaign.status,
      },
    });
  } catch (err: any) {
    if (err.message === "FORBIDDEN" || err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized. Campaign Manager or Admin role required." },
        { status: 403 }
      );
    }

    if (userId) {
      recordFailedAttempt(`user:${userId}`);
    }
    recordFailedAttempt(`ip:${clientIp}`);

    return NextResponse.json(
      { error: GENERIC_INVALID_ERROR },
      { status: 400 }
    );
  }
}
