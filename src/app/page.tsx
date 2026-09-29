export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { CampaignStatus, SubmissionStatus, PayoutStatus } from "@prisma/client";
import LandingView, { HomepageCampaign, HomepageStats } from "@/components/landing/LandingView";

export default async function LandingPage() {
  const now = new Date();

  // Query database for active, publicly visible campaigns and platform metrics
  const [dbCampaigns, paidAgg, viewsAgg] = await Promise.all([
    prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        start_date: { lte: now },
        OR: [
          { end_date: null },
          { end_date: { gte: now } },
        ],
      },
      orderBy: { created_at: "desc" },
      include: {
        submissions: {
          where: { status: SubmissionStatus.APPROVED },
          select: {
            current_views: true,
          },
        },
      },
      take: 9,
    }),
    prisma.payout.aggregate({
      where: { status: PayoutStatus.PAID },
      _sum: { amount: true },
    }),
    prisma.submission.aggregate({
      where: { status: SubmissionStatus.APPROVED },
      _sum: { current_views: true },
    }),
  ]);

  const campaigns: HomepageCampaign[] = dbCampaigns.map((c) => {
    const totalApprovedViews = c.submissions.reduce(
      (sum, s) => sum + (s.current_views || 0),
      0
    );
    const minViews = c.minimum_views_for_payout || 0;
    const hasReachedMinViews = minViews > 0 ? totalApprovedViews >= minViews : true;
    const usedBudget = hasReachedMinViews ? Number(c.used_budget) : 0;
    const totalBudget = Number(c.total_budget);
    const cpm = Number(c.cpm);
    const maxPayableViews = cpm > 0 ? Math.floor((totalBudget / cpm) * 1000) : 0;

    return {
      id: c.id,
      name: c.name,
      brand_name: c.brand_name,
      image_url: c.image_url,
      cpm,
      total_budget: totalBudget,
      used_budget: usedBudget,
      total_approved_views: totalApprovedViews,
      max_payable_views: maxPayableViews,
      allowed_platforms: c.allowed_platforms,
      status: c.status,
    };
  });

  const stats: HomepageStats = {
    totalPaid: Number(paidAgg._sum.amount || 0),
    totalViews: viewsAgg._sum.current_views || 0,
  };

  return <LandingView campaigns={campaigns} stats={stats} />;
}
