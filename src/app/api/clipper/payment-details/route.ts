import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { encryptToken, decryptToken } from "@/lib/encryption";

/**
 * GET /api/clipper/payment-details
 * Returns the authenticated clipper's payment profile (private to user and admin only).
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const account = await prisma.payoutAccount.findUnique({
      where: { user_id: user.id },
    });

    if (!account) {
      return NextResponse.json({
        data: null,
        hasPaymentDetails: false,
      });
    }

    return NextResponse.json({
      data: {
        id: account.id,
        provider: account.provider,
        accountReference: account.account_reference,
        status: account.status,
        updatedAt: account.updated_at,
      },
      hasPaymentDetails: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch payment details" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clipper/payment-details
 * Creates or updates the authenticated clipper's payout account.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { provider, accountReference, extraDetails } = body;

    if (!provider || !accountReference || !accountReference.trim()) {
      return NextResponse.json(
        { error: "Payment method and account identifier (e.g. PayPal email or wallet address) are required." },
        { status: 400 }
      );
    }

    const cleanReference = accountReference.trim();
    const cleanProvider = String(provider).toUpperCase().trim();

    // Encrypt sensitive extra details if provided
    let detailsEncrypted: string | null = null;
    if (extraDetails && Object.keys(extraDetails).length > 0) {
      detailsEncrypted = encryptToken(JSON.stringify(extraDetails));
    }

    const updatedAccount = await prisma.payoutAccount.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        provider: cleanProvider,
        account_reference: cleanReference,
        details_encrypted: detailsEncrypted,
        status: "ACTIVE",
      },
      update: {
        provider: cleanProvider,
        account_reference: cleanReference,
        details_encrypted: detailsEncrypted,
        status: "ACTIVE",
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "CLIPPER_PAYMENT_DETAILS_UPDATED",
      targetType: "PAYOUT_ACCOUNT",
      targetId: updatedAccount.id,
      newValue: {
        provider: cleanProvider,
        maskedReference: cleanReference.length > 4 ? `•••${cleanReference.slice(-4)}` : cleanReference,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment details saved successfully.",
      data: {
        id: updatedAccount.id,
        provider: updatedAccount.provider,
        accountReference: updatedAccount.account_reference,
        status: updatedAccount.status,
        updatedAt: updatedAccount.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save payment details" },
      { status: 500 }
    );
  }
}
