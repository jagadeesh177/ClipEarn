import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generates a unique, hard-to-guess manager campaign access code.
 * Example format: CE-MGR-7K4P9X
 */
export function generateAccessCode(): string {
  const bytes = crypto.randomBytes(6);
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += CHARSET[bytes[i] % CHARSET.length];
  }
  return `CE-MGR-${randomPart}`;
}

/**
 * Checks whether a user has permission to manage/access a campaign.
 * Admins have global access.
 * Managers only have access if they have successfully redeemed an access code.
 */
export async function hasManagerCampaignAccess(
  userId: string,
  campaignId: string,
  role: UserRole
): Promise<boolean> {
  if (role === UserRole.ADMIN) {
    return true;
  }

  if (role === UserRole.MANAGER) {
    const access = await prisma.campaignAccessCode.findFirst({
      where: {
        campaign_id: campaignId,
        redeemed_by: userId,
        status: "REDEEMED",
      },
    });
    return !!access;
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
