import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const PREAUTH_COOKIE_NAME = "clipearn_mgr_preauth";

/**
 * Returns the secret used to sign pre-auth tickets. Throws if SESSION_SECRET
 * isn't set, instead of silently falling back to a hardcoded value that's
 * visible in the public repo (which would let anyone forge a valid ticket).
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Missing SESSION_SECRET environment variable. Set it before validating or signing manager access keys."
    );
  }
  return secret;
}

/**
 * Normalizes an access key into canonical uppercase format.
 */
export function normalizeManagerAccessKey(key: string): string {
  const raw = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.startsWith("CEINVITE")) {
    return `CE-INVITE-${raw.slice(8)}`;
  }
  if (raw.startsWith("CEMGR")) {
    return `CE-MGR-${raw.slice(5)}`;
  }
  return key.trim().toUpperCase();
}

/**
 * Computes SHA-256 digest of normalized manager access key.
 */
export function hashManagerAccessKey(key: string): string {
  const normalized = normalizeManagerAccessKey(key);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Creates safe masked preview of key for Admin UI and audit logs.
 * e.g., "CE-INVITE-••••-7K4P"
 */
export function maskManagerAccessKey(key: string): string {
  const normalized = normalizeManagerAccessKey(key);
  const raw = normalized.replace(/[^A-Z0-9]/g, "");
  const isInvite = raw.startsWith("CEINVITE");
  const prefix = isInvite ? "CE-INVITE" : "CE-MGR";
  const randomPart = isInvite ? raw.slice(8) : raw.startsWith("CEMGR") ? raw.slice(5) : raw;
  if (randomPart.length <= 4) {
    return `${prefix}-••••`;
  }
  const last4 = randomPart.slice(-4);
  return `${prefix}-••••-${last4}`;
}

/**
 * Generates cryptographically secure, high-entropy Campaign Manager Invitation Key.
 *
 * Format: CE-INVITE-XXXXXXXX (8 random chars from 32-char charset = 32^8 ≈ 1.1 × 10^12 combinations)
 */
export function generateManagerAccessKey(): {
  plaintextKey: string;
  keyHash: string;
  keyPreview: string;
} {
  const bytes = crypto.randomBytes(8);
  let randomPart = "";
  for (let i = 0; i < 8; i++) {
    randomPart += CHARSET[bytes[i] % CHARSET.length];
  }

  const plaintextKey = `CE-INVITE-${randomPart}`;
  const keyHash = hashManagerAccessKey(plaintextKey);
  const keyPreview = `CE-INVITE-••••-${randomPart.slice(-4)}`;

  return { plaintextKey, keyHash, keyPreview };
}

/**
 * Generates an HMAC-SHA256 signed pre-authentication ticket.
 * Issued after successful server-side Access Key validation to gate the subsequent Discord OAuth step.
 */
export function signPreAuthTicket(keyId: string): string {
  const payload = JSON.stringify({
    keyId,
    nonce: crypto.randomBytes(16).toString("hex"),
    iat: Date.now(),
    exp: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
  });

  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the HMAC-SHA256 signature and expiration of a pre-auth ticket.
 */
export function verifyPreAuthTicket(ticketStr: string): {
  valid: boolean;
  keyId?: string;
} {
  try {
    const [payloadB64, signature] = ticketStr.split(".");
    if (!payloadB64 || !signature) {
      return { valid: false };
    }

    const expectedSig = crypto
      .createHmac("sha256", getSessionSecret())
      .update(payloadB64)
      .digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));

    if (Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, keyId: payload.keyId };
  } catch {
    return { valid: false };
  }
}
