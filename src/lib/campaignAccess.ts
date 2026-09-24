import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * 32-character unambiguous alphanumeric charset excluding easily confused characters:
 * 0 (zero), O (capital O), 1 (one), I (capital I).
 */
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Normalizes an access code to standard uppercase format, stripping excess spaces/symbols.
 */
export function normalizeAccessCode(code: string): string {
  const raw = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.startsWith("CEMGR")) {
    return `CE-MGR-${raw.slice(5)}`;
  }
  return code.trim().toUpperCase();
}

/**
 * Securely hashes an access code using SHA-256 so that plaintext codes
 * are never stored in the database or exposed in database dumps.
 */
export function hashAccessCode(code: string): string {
  const normalized = normalizeAccessCode(code);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Generates a masked preview of the access code for Admin audit logs
 * and listings without revealing the sensitive secret entropy.
 * e.g., "CE-MGR-••••-••••-7K4P"
 */
export function maskAccessCode(code: string): string {
  const normalized = normalizeAccessCode(code);
  const raw = normalized.replace(/[^A-Z0-9]/g, "");
  const randomPart = raw.startsWith("CEMGR") ? raw.slice(5) : raw;
  if (randomPart.length <= 4) {
    return "CE-MGR-••••";
  }
  const last4 = randomPart.slice(-4);
  return `CE-MGR-••••-••••-${last4}`;
}

/**
 * Generates a cryptographically secure, high-entropy Campaign Manager Access Code.
 *
 * Uses Node's crypto.randomBytes to pick 12 characters from a 32-char alphabet.
 * 32^12 = 2^60 ≈ 1.15 × 10^18 combinations (60 bits of cryptographic entropy).
 *
 * Returns:
 * - plaintextCode: Formatted code to show the Admin ONCE (e.g. CE-MGR-7K4P-9X3M-2B8N)
 * - codeHash: SHA-256 digest stored securely in the database
 * - codePreview: Masked preview string for Admin dashboards (e.g. CE-MGR-••••-••••-2B8N)
 */
export function generateAccessCode(): {
  plaintextCode: string;
  codeHash: string;
  codePreview: string;
} {
  const bytes = crypto.randomBytes(12);
  let randomPart = "";
  for (let i = 0; i < 12; i++) {
    randomPart += CHARSET[bytes[i] % CHARSET.length];
  }

  const plaintextCode = `CE-MGR-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}-${randomPart.slice(8, 12)}`;
  const codeHash = hashAccessCode(plaintextCode);
  const codePreview = `CE-MGR-••••-••••-${randomPart.slice(8, 12)}`;

  return { plaintextCode, codeHash, codePreview };
}

/**
 * Checks whether a user has permission to manage/access a campaign.
 * - Admins have global access.
 * - Managers only have access if they have successfully redeemed an access code record.
 */
export async function hasManagerCampaignAccess(
  userId: string,
  campaignId: string,
  role: UserRole
): Promise<boolean> {
  if (role === UserRole.ADMIN || role === UserRole.MANAGER) {
    return true;
  }
  return false;
}

/**
 * Retrieves the list of campaign IDs that a manager has redeemed access to.
 */
export async function getAccessibleCampaignIdsForManager(userId: string): Promise<string[]> {
  const records = await prisma.campaignAccessCode.findMany({
    where: {
      redeemed_by: userId,
      status: "REDEEMED",
    },
    select: {
      campaign_id: true,
    },
  });

  return records.map((r) => r.campaign_id);
}
