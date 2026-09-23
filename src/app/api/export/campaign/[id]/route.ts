import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import * as XLSX from "xlsx";

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

    // Calculations for Executive Summary
    const totalSubmissions = campaign.submissions.length;
    const approvedSubmissions = campaign.submissions.filter((s) => s.status === "APPROVED");
    const pendingSubmissions = campaign.submissions.filter((s) => s.status === "PENDING");
    const rejectedSubmissions = campaign.submissions.filter((s) => s.status === "REJECTED");

    const totalViews = campaign.submissions.reduce((acc, s) => acc + (s.current_views || 0), 0);
    const eligibleViews = campaign.submissions.reduce((acc, s) => acc + (s.eligible_views || 0), 0);
    const totalSpent = Number(campaign.used_budget);
    const totalBudget = Number(campaign.total_budget);
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    const absorptionRate = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) + "%" : "0.0%";

    // Platform breakdown
    const platforms = ["TIKTOK", "INSTAGRAM", "YOUTUBE"];
    const platformBreakdown = platforms.map((plat) => {
      const platSubmissions = campaign.submissions.filter((s) => s.platform === plat);
      const platApproved = platSubmissions.filter((s) => s.status === "APPROVED");
      const platViews = platSubmissions.reduce((acc, s) => acc + (s.eligible_views || 0), 0);
      const platSpend = platSubmissions.reduce((acc, s) => acc + Number(s.current_earnings || 0), 0);

      return {
        platform: plat === "TIKTOK" ? "TikTok" : plat === "INSTAGRAM" ? "Instagram Reels" : "YouTube Shorts",
        clips: platApproved.length,
        views: platViews,
        spend: `$${platSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        shareOfViews: eligibleViews > 0 ? ((platViews / eligibleViews) * 100).toFixed(1) + "%" : "0.0%",
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Client Executive Summary
    const summaryRows: any[][] = [
      ["CLIPEARN — OFFICIAL CLIENT CAMPAIGN PERFORMANCE REPORT", ""],
      ["Confidential — Prepared for Brand & Agency Review", ""],
      ["", ""],
      ["CAMPAIGN PROFILE", ""],
      ["Client / Brand Name", campaign.brand_name],
      ["Campaign Title", campaign.name],
      ["Campaign Status", campaign.status],
      ["Contracted CPM Rate", `$${Number(campaign.cpm).toFixed(2)} per 1,000 verified views`],
      ["Target Allowed Platforms", campaign.allowed_platforms.join(", ")],
      ["Report Generation Date", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
      ["", ""],
      ["FINANCIAL & BUDGET RECONCILIATION", ""],
      ["Contracted Campaign Budget", `$${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ["Total Budget Spent (Accrued)", `$${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ["Remaining Contract Budget Pool", `$${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ["Budget Utilization Rate", absorptionRate],
      ["", ""],
      ["PERFORMANCE & ENGAGEMENT TOTALS", ""],
      ["Total Clips Submitted", totalSubmissions],
      ["Approved & Verified Clips", approvedSubmissions.length],
      ["Pending Review Queue", pendingSubmissions.length],
      ["Rejected / Non-compliant Clips", rejectedSubmissions.length],
      ["Total Gross Views Tracked", totalViews.toLocaleString()],
      ["Total Verified Eligible Views", eligibleViews.toLocaleString()],
      ["Average Views Per Approved Clip", approvedSubmissions.length > 0 ? Math.round(eligibleViews / approvedSubmissions.length).toLocaleString() : "0"],
      ["Effective Cost Per 1,000 Views", eligibleViews > 0 ? `$${((totalSpent / eligibleViews) * 1000).toFixed(2)}` : `$${Number(campaign.cpm).toFixed(2)}`],
      ["", ""],
      ["PLATFORM-BY-PLATFORM BREAKDOWN", "", "", ""],
      ["Platform", "Approved Deliverables", "Verified Views", "Accrued Spend ($)", "View Share (%)"],
      ...platformBreakdown.map((p) => [p.platform, p.clips, p.views.toLocaleString(), p.spend, p.shareOfViews]),
      ["", ""],
      ["AUDIT & VERIFICATION POLICY", ""],
      ["Verification Frequency", "Every 8 hours automated platform API view sync"],
      ["Fraud Protection", "Manager manual review + automated duplicate post verification"],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary["!cols"] = [
      { wch: 38 },
      { wch: 32 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
    ];

    // Sheet 2: All Deliverable Clips Line-Item Details
    const detailsHeader = [
      "Item #",
      "Creator Username",
      "Social Account Handle",
      "Platform",
      "Clip Published URL",
      "Total Views",
      "Eligible Views",
      "Accrued Spend ($)",
      "Review Status",
      "Submission Date",
      "Approval Date",
      "Manager Notes / Feedback",
    ];

    const detailsRows = campaign.submissions.map((s, idx) => [
      idx + 1,
      s.user?.username || "Anonymous",
      s.social_account?.username ? `@${s.social_account.username}` : "Not Connected",
      s.platform,
      s.post_url,
      s.current_views,
      s.eligible_views,
      Number(s.current_earnings || 0).toFixed(2),
      s.status,
      s.submitted_at.toISOString().split("T")[0] + " " + s.submitted_at.toISOString().split("T")[1].slice(0, 5),
      s.reviewed_at ? s.reviewed_at.toISOString().split("T")[0] + " " + s.reviewed_at.toISOString().split("T")[1].slice(0, 5) : "-",
      s.rejection_reason || "-",
    ]);

    const wsDetails = XLSX.utils.aoa_to_sheet([detailsHeader, ...detailsRows]);
    wsDetails["!cols"] = [
      { wch: 8 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
      { wch: 54 },
      { wch: 15 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 35 },
    ];

    // Append sheets
    XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");
    XLSX.utils.book_append_sheet(wb, wsDetails, "All Deliverable Clips");

    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const safeBrand = campaign.brand_name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeCamp = campaign.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeBrand}_${safeCamp}_Client_Report.xlsx`;

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden: Manager or Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: err?.message || "Failed to export campaign sheet" }, { status: 500 });
  }
}
