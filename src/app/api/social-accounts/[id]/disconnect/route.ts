import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handleDelete(params.id);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handleDelete(params.id);
}

async function handleDelete(id: string) {
  try {
    const user = await requireAuth();

    const account = await prisma.socialAccount.findUnique({
      where: { id },
    });

    if (!account || account.user_id !== user.id) {
      return NextResponse.json({ error: "Social account not found" }, { status: 404 });
    }

    // Permanently delete ONLY the social account.
    // All submitted clips, snapshots, views, and earnings remain 100% intact on the website.
    await prisma.$transaction(async (tx) => {
      // Safely unlink submissions from this social account
      await tx.submission.updateMany({
        where: { social_account_id: account.id },
        data: { social_account_id: null },
      });

      // Delete only the social account record itself
      await tx.socialAccount.delete({
        where: { id: account.id },
      });
    });

    await logAuditEvent({
      actorId: user.id,
      action: "SOCIAL_ACCOUNT_DELETED",
      targetType: "SOCIAL_ACCOUNT",
      targetId: account.id,
      oldValue: {
        platform: account.platform,
        username: account.username,
      },
    });

    return NextResponse.json({ success: true, message: "Social account permanently deleted" });
  } catch (err: any) {
    console.error("Error deleting social account:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete social account from database" },
      { status: 500 }
    );
  }
}
