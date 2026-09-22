import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, UserStatus, SubmissionStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
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
              ],
            }
          : {}),
      },
      include: {
        social_accounts: true,
        campaign_memberships: true,
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
      const approvedClips = c.submissions.filter((s) => s.status === SubmissionStatus.APPROVED).length;
      const totalViews = c.submissions.reduce((sum, s) => sum + s.current_views, 0);
      const eligibleViews = c.submissions.reduce((sum, s) => sum + s.eligible_views, 0);
      const totalEarnings = c.submissions.reduce((sum, s) => sum + Number(s.current_earnings), 0);

      return {
        id: c.id,
        username: c.username,
        email: c.email,
        discord_id: c.discord_id,
        avatar_url: c.avatar_url,
        status: c.status,
        referral_code: c.referral_code,
        connected_accounts_count: c.social_accounts.length,
        verified_accounts_count: c.social_accounts.filter((a) => a.verification_status === "VERIFIED").length,
        campaigns_joined_count: c.campaign_memberships.length,
        total_clips: totalClips,
        approved_clips: approvedClips,
        total_views: totalViews,
        eligible_views: eligibleViews,
        total_earnings: totalEarnings,
        created_at: c.created_at,
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch clippers" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const manager = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: "User ID and status are required." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: status as UserStatus },
    });

    await logAuditEvent({
      actorId: manager.id,
      action: `USER_STATUS_${status}`,
      targetType: "USER",
      targetId: userId,
      newValue: { status },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update clipper status" }, { status: 500 });
  }
}
