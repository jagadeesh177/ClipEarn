import { PrismaClient, SubmissionStatus, CampaignStatus, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== RECONCILING APPROVED VIEWS AND EARNINGS ===");

  const campaigns = await prisma.campaign.findMany({
    include: {
      submissions: {
        where: { status: SubmissionStatus.APPROVED },
      },
    },
  });

  for (const campaign of campaigns) {
    console.log(`Processing Campaign: ${campaign.name} (ID: ${campaign.id})`);
    const cpmRate = Number(campaign.cpm);
    const totalBudget = Number(campaign.total_budget);
    let cumulativeUsedBudget = 0;

    for (const sub of campaign.submissions) {
      console.log(`\n  Checking Submission: ${sub.id}`);
      console.log(`  Current verified views: ${sub.current_views}`);
      console.log(`  Previous eligible_views: ${sub.eligible_views}`);
      console.log(`  Previous current_earnings: ${sub.current_earnings}`);

      // In accordance with ClipEarn business rule:
      // Once approved, current verified views count as Approved / Eligible Views
      let eligibleViews = sub.current_views;
      if (campaign.maximum_views_per_clip && eligibleViews > campaign.maximum_views_per_clip) {
        eligibleViews = campaign.maximum_views_per_clip;
      }

      let subEarnings = (eligibleViews / 1000) * cpmRate;
      if (cumulativeUsedBudget + subEarnings > totalBudget) {
        subEarnings = Math.max(0, totalBudget - cumulativeUsedBudget);
        eligibleViews = cpmRate > 0 ? Math.floor((subEarnings / cpmRate) * 1000) : 0;
      }

      cumulativeUsedBudget += subEarnings;

      // Update submission record
      await prisma.submission.update({
        where: { id: sub.id },
        data: {
          eligible_views: eligibleViews,
          current_earnings: new Prisma.Decimal(subEarnings.toFixed(2)),
        },
      });

      console.log(`  -> Corrected eligible_views: ${eligibleViews}`);
      console.log(`  -> Corrected current_earnings: $${subEarnings.toFixed(2)}`);

      // Reconcile earnings ledger for this submission
      // Remove old sync entries and replace with accurate entry
      await prisma.earningsLedger.deleteMany({
        where: { submission_id: sub.id },
      });

      if (subEarnings > 0) {
        await prisma.earningsLedger.create({
          data: {
            user_id: sub.user_id,
            campaign_id: campaign.id,
            submission_id: sub.id,
            event_type: "SUBMISSION_APPROVED",
            views: eligibleViews,
            rate_per_1000: new Prisma.Decimal(cpmRate),
            amount: new Prisma.Decimal(subEarnings.toFixed(4)),
            created_at: sub.reviewed_at || sub.created_at,
          },
        });
      }
    }

    // Update campaign used_budget
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        used_budget: new Prisma.Decimal(cumulativeUsedBudget.toFixed(2)),
        status: cumulativeUsedBudget >= totalBudget ? CampaignStatus.PAUSED : campaign.status,
      },
    });

    console.log(`\nCampaign ${campaign.name} reconciled total used_budget: $${cumulativeUsedBudget.toFixed(2)} / $${totalBudget.toFixed(2)}`);
  }

  console.log("\n=== RECONCILIATION COMPLETE ===");
}

main()
  .catch((err) => {
    console.error("Error during reconciliation:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
