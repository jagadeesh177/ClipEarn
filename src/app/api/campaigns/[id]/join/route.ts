import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { CampaignStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      return NextResponse.json({ error: "This campaign is not currently accepting new clippers" }, { status: 400 });
    }

    // Check existing membership
    const existing = await prisma.campaignMembership.findUnique({
      where: {
        campaign_id_user_id: {
          campaign_id: params.id,
          user_id: user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Already joined", membership: existing });
    }

    const membership = await prisma.campaignMembership.create({
      data: {
        campaign_id: params.id,
        user_id: user.id,
      },
    });

    // Notification
    await prisma.notification.create({
      data: {
        user_id: user.id,
        type: "CAMPAIGN_JOINED",
        title: "Joined Campaign! 🚀",
        message: `You have successfully joined "${campaign.name}". Connect your verified social accounts and start submitting clips!`,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "CAMPAIGN_JOINED",
      targetType: "CAMPAIGN",
      targetId: params.id,
    });

    return NextResponse.json({ success: true, membership }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to join campaign" }, { status: 500 });
  }
}
