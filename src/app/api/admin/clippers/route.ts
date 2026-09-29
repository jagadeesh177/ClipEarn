import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, UserStatus, SubmissionStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    await requireRole([UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const clippers = await prisma.user.findMany({
      where: {
        role: UserRole.CLIPPER,
        ...(search
          ? {
              OR: [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { discord_id: { contains: search, mode: "insensitive" } },
                { referral_code: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        social_accounts: true,
        campaign_memberships: {
          include: {
            campaign: {
              select: { id: true, name: true, brand_name: true },
            },
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
            current_views: true,
            eligible_views: true,
            current_earnings: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const formatted = clippers.map((c) => {
      const totalClips = c.submissions.length;
      const approvedSubmissions = c.submissions.filter((s) => s.status === SubmissionStatus.APPROVED);
      const approvedClips = approvedSubmissions.length;
      const totalViews = c.submissions.reduce((sum, s) => sum + s.current_views, 0);
      const approvedViews = approvedSubmissions.reduce((sum, s) => sum + s.current_views, 0);
      const totalEarnings = approvedSubmissions.reduce((sum, s) => sum + Number(s.current_earnings), 0);

      return {
        id: c.id,
        username: c.username,
        email: c.email,
        discord_id: c.discord_id,
        avatar_url: c.avatar_url,
        status: c.status,
        suspension_reason: c.suspension_reason,
        suspended_at: c.suspended_at,
        referral_code: c.referral_code,
        connected_accounts_count: c.social_accounts.length,
        total_clips: totalClips,
        approved_clips: approvedClips,
        total_views: totalViews,
        approved_views: approvedViews,
        total_earnings: totalEarnings,
        campaigns_joined: c.campaign_memberships.map((m) => ({
          id: m.campaign.id,
          name: m.campaign.name,
          brand_name: m.campaign.brand_name,
        })),
        created_at: c.created_at,
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch admin clippers" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const body = await request.json().catch(() => ({}));
    const { userId, status, reason } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "userId and status are required" }, { status: 400 });
    }

    if (!["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Clipper not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: status as UserStatus,
        suspension_reason: status !== "ACTIVE" ? reason || "Administrative action" : null,
        suspended_at: status !== "ACTIVE" ? new Date() : null,
      },
    });

    await logAuditEvent({
      actorId: admin.id,
      action: status === "ACTIVE" ? "CLIPPER_RESTORED" : "CLIPPER_SUSPENDED",
      targetType: "USER",
      targetId: userId,
      oldValue: { status: targetUser.status },
      newValue: { status, reason },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update clipper" },
      { status: 500 }
    );
  }
}
