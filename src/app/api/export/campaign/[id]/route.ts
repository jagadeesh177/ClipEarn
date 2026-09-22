import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        submissions: {
          include: {
            user: { select: { username: true, email: true } },
            social_account: { select: { username: true } },
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Generate CSV string
    const headers = [
      "Submission ID",
      "Clipper",
      "Social Account",
      "Platform",
      "Video URL",
      "Current Views",
      "Eligible Views",
      "Earnings (USD)",
      "Status",
      "Rejection Reason",
      "Submission Date",
      "Approval Date",
    ];

    const rows = campaign.submissions.map((s) => [
      s.id,
      `"${s.user.username}"`,
      `"@${s.social_account.username}"`,
      s.platform,
      `"${s.post_url}"`,
      s.current_views,
      s.eligible_views,
      Number(s.current_earnings).toFixed(2),
      s.status,
      `"${s.rejection_reason || ""}"`,
      s.submitted_at.toISOString(),
      s.reviewed_at ? s.reviewed_at.toISOString() : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const filename = `clipearn_${campaign.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_export.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to export campaign data" }, { status: 500 });
  }
}
