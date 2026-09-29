export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CampaignStatus, SubmissionStatus } from "@prisma/client";
import LandingView, { HomepageCampaign } from "@/components/landing/LandingView";

export const metadata: Metadata = {
  title: "ClipEarn — Performance-Based Short-Form Content Distribution",
  description:
    "ClipEarn helps brands scale their reach through performance-based short-form content distribution across TikTok, Instagram, and YouTube, while clippers earn from verified campaign performance.",
  openGraph: {
    title: "ClipEarn — Performance-Based Short-Form Content Distribution",
    description:
      "ClipEarn helps brands scale their reach through performance-based short-form content distribution across TikTok, Instagram, and YouTube, while clippers earn from verified campaign performance.",
    url: "https://clipearn.vercel.app/",
    siteName: "ClipEarn",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipEarn — Performance-Based Short-Form Content Distribution",
    description:
      "ClipEarn helps brands scale their reach through performance-based short-form content distribution across TikTok, Instagram, and YouTube, while clippers earn from verified campaign performance.",
  },
  alternates: {
    canonical: "https://clipearn.vercel.app/",
  },
};

export default async function LandingPage() {
  const now = new Date();

  // Query database for active, publicly visible campaigns
  const dbCampaigns = await prisma.campaign.findMany({
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
    take: 6,
  });

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

  return <LandingView campaigns={campaigns} />;
}
