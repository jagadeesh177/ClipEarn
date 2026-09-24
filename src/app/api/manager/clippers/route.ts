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

export async function DELETE(request: Request) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (targetUser.role === UserRole.ADMIN) {
      return NextResponse.json({ error: "Cannot delete an Admin account." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.viewSnapshot.deleteMany({ where: { submission: { user_id: userId } } });
      await tx.earningsLedger.deleteMany({ where: { user_id: userId } });
      await tx.payout.deleteMany({ where: { user_id: userId } });
      await tx.notification.deleteMany({ where: { user_id: userId } });
      await tx.fraudFlag.deleteMany({ where: { user_id: userId } });
      await tx.submission.deleteMany({ where: { user_id: userId } });
      await tx.campaignMembership.deleteMany({ where: { user_id: userId } });
      await tx.socialAccount.deleteMany({ where: { user_id: userId } });
      await tx.referral.deleteMany({ where: { OR: [{ referrer_id: userId }, { referred_user_id: userId }] } });
      await tx.managerAccessKey.updateMany({ where: { used_by: userId }, data: { used_by: null, status: "REVOKED" } });
      await tx.user.delete({ where: { id: userId } });
    });

    await logAuditEvent({
      actorId: admin.id,
      action: "USER_DELETED",
      targetType: "USER",
      targetId: userId,
      oldValue: { username: targetUser.username, email: targetUser.email, role: targetUser.role },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete user" }, { status: 500 });
  }
}

