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

    // Permanently delete social account and its dependent records from the database
    await prisma.$transaction(async (tx) => {
      // Find all submissions referencing this social account
      const submissions = await tx.submission.findMany({
        where: { social_account_id: account.id },
        select: { id: true },
      });
      const subIds = submissions.map((s) => s.id);

      if (subIds.length > 0) {
        await tx.viewSnapshot.deleteMany({
          where: { submission_id: { in: subIds } },
        });
        await tx.earningsLedger.deleteMany({
          where: { submission_id: { in: subIds } },
        });
        await tx.fraudFlag.deleteMany({
          where: { submission_id: { in: subIds } },
        });
        await tx.submission.deleteMany({
          where: { id: { in: subIds } },
        });
      }

      // Delete the social account record itself
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
