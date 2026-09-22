import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { VerificationStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const account = await prisma.socialAccount.findUnique({
      where: { id: params.id },
    });

    if (!account || account.user_id !== user.id) {
      return NextResponse.json({ error: "Social account not found" }, { status: 404 });
    }

    // Mark as DISCONNECTED so historical submissions remain linked
    const updated = await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        verification_status: VerificationStatus.DISCONNECTED,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "SOCIAL_ACCOUNT_DISCONNECTED",
      targetType: "SOCIAL_ACCOUNT",
      targetId: account.id,
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to disconnect account" }, { status: 500 });
  }
}
