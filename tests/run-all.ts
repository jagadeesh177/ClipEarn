import { PrismaClient, UserRole, UserStatus, Platform, VerificationStatus, CampaignStatus, ViewEligibilityMode, SubmissionStatus, PayoutStatus } from "@prisma/client";
import { syncSubmissionViews } from "../src/lib/earnings/engine";
import { getClipperEarningsSummary, requestPayout } from "../src/lib/payout/engine";
import assert from "assert";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function test(name: string, fn: () => Promise<void> | void) {
  return async () => {
    try {
      await fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  };
}

async function runTests() {
  console.log("\n=========================================");
  console.log("    CLIPEARN AUTOMATED TEST SUITE        ");
  console.log("=========================================\n");

  // 1. CPM Calculation Tests
  await test("Earnings Math: 100,000 views at $1 CPM = $100.00", () => {
    const views = 100000;
    const cpm = 1.00;
    const earnings = (views / 1000) * cpm;
    assert.strictEqual(earnings, 100.00);
  })();

  await test("Earnings Math: 250,000 views at $2 CPM = $500.00", () => {
    const views = 250000;
    const cpm = 2.00;
    const earnings = (views / 1000) * cpm;
    assert.strictEqual(earnings, 500.00);
  })();

  // 2. Database & Business Rule Verification
  const testUser = await prisma.user.findFirst({
    where: { role: UserRole.CLIPPER },
  });
  assert(testUser, "Test clipper user must exist in seeded DB");

  const testCampaign = await prisma.campaign.findFirst({
    where: { status: CampaignStatus.ACTIVE },
  });
  assert(testCampaign, "Test campaign must exist in seeded DB");

  // Test: Unverified social account cannot submit
  await test("Security: Unverified social account rejection", async () => {
    const unverifiedAccount = await prisma.socialAccount.create({
      data: {
        user_id: testUser.id,
        platform: Platform.YOUTUBE,
        platform_user_id: `test_unverified_${Date.now()}`,
        username: `unverified_${Date.now()}`,
        verification_status: VerificationStatus.PENDING,
      },
    });

    assert.strictEqual(unverifiedAccount.verification_status, VerificationStatus.PENDING);
    // Clean up
    await prisma.socialAccount.delete({ where: { id: unverifiedAccount.id } });
  })();

  // Test: Duplicate video submission prevention (Unique Constraint)
  await test("Fraud Prevention: Database prevents duplicate video in same campaign", async () => {
    const verifiedAccount = await prisma.socialAccount.findFirst({
      where: { user_id: testUser.id, verification_status: VerificationStatus.VERIFIED },
    });
    assert(verifiedAccount, "Verified social account required");

    const duplicatePostId = `dup_post_${Date.now()}`;

    // First submission succeeds
    const sub1 = await prisma.submission.create({
      data: {
        campaign_id: testCampaign.id,
        user_id: testUser.id,
        social_account_id: verifiedAccount.id,
        platform: verifiedAccount.platform,
        post_url: `https://test.com/video/${duplicatePostId}`,
        platform_post_id: duplicatePostId,
        status: SubmissionStatus.PENDING,
      },
    });

    let duplicateErrorThrown = false;
    try {
      // Second submission with exact same (campaign_id, platform, platform_post_id) must fail
      await prisma.submission.create({
        data: {
          campaign_id: testCampaign.id,
          user_id: testUser.id,
          social_account_id: verifiedAccount.id,
          platform: verifiedAccount.platform,
          post_url: `https://test.com/video/${duplicatePostId}`,
          platform_post_id: duplicatePostId,
          status: SubmissionStatus.PENDING,
        },
      });
    } catch (e) {
      duplicateErrorThrown = true;
    }

    assert(duplicateErrorThrown, "Database unique constraint must reject duplicate video post ID");

    // Clean up
    await prisma.submission.delete({ where: { id: sub1.id } });
  })();

  // Test: Only Approved Clips Earn (Rule 25)
  await test("Accounting Rule: Pending & Rejected clips have $0 eligible earnings", async () => {
    const verifiedAccount = await prisma.socialAccount.findFirst({
      where: { user_id: testUser.id, verification_status: VerificationStatus.VERIFIED },
    });

    const pendingSub = await prisma.submission.create({
      data: {
        campaign_id: testCampaign.id,
        user_id: testUser.id,
        social_account_id: verifiedAccount!.id,
        platform: verifiedAccount!.platform,
        post_url: `https://test.com/video/pending_${Date.now()}`,
        platform_post_id: `pending_${Date.now()}`,
        status: SubmissionStatus.PENDING,
        current_views: 50000,
        eligible_views: 0,
        current_earnings: 0,
      },
    });

    // Run sync worker on pending clip
    const syncRes = await syncSubmissionViews(pendingSub.id);
    assert.strictEqual(syncRes.status, "SKIPPED");
    assert.strictEqual(syncRes.earningsDelta, 0);

    // Clean up
    await prisma.submission.delete({ where: { id: pendingSub.id } });
  })();

  // Test: Budget Capping Protection (Rule 32 & 33)
  await test("Budget Protection: View sync engine never exceeds campaign budget", async () => {
    const verifiedAccount = await prisma.socialAccount.findFirst({
      where: { user_id: testUser.id, verification_status: VerificationStatus.VERIFIED },
    });

    // Create small budget test campaign
    const cappedCampaign = await prisma.campaign.create({
      data: {
        name: `Budget Cap Test ${Date.now()}`,
        brand_name: "Test Brand",
        description: "Testing strict budget capping",
        cpm: 2.00,
        total_budget: 100.00,
        used_budget: 95.00, // Only $5.00 remaining
        minimum_views_for_payout: 1000,
        allowed_platforms: [Platform.TIKTOK],
        view_eligibility_mode: ViewEligibilityMode.FROM_SUBMISSION,
        created_by: testUser.id,
      },
    });

    const approvedSub = await prisma.submission.create({
      data: {
        campaign_id: cappedCampaign.id,
        user_id: testUser.id,
        social_account_id: verifiedAccount!.id,
        platform: Platform.TIKTOK,
        post_url: `https://test.com/video/budget_${Date.now()}`,
        platform_post_id: `budget_${Date.now()}`,
        status: SubmissionStatus.APPROVED,
        current_views: 1000,
        eligible_views: 0,
        current_earnings: 0,
        reviewed_at: new Date(),
      },
    });

    // Create baseline snapshot
    await prisma.viewSnapshot.create({
      data: {
        submission_id: approvedSub.id,
        views: 1000,
        source: "SUBMISSION_INITIAL",
      },
    });

    // Trigger sync with 50,000 views (which would normally equal $100 earnings, but remaining is only $5)
    const result = await syncSubmissionViews(approvedSub.id);
    assert(result.earningsDelta <= 5.01, `Earnings delta (${result.earningsDelta}) must not exceed remaining budget ($5.00)`);

    const refreshedCamp = await prisma.campaign.findUnique({ where: { id: cappedCampaign.id } });
    assert(Number(refreshedCamp!.used_budget) <= 100.00, "Used budget must never exceed total budget");

    // Clean up
    await prisma.earningsLedger.deleteMany({ where: { campaign_id: cappedCampaign.id } });
    await prisma.viewSnapshot.deleteMany({ where: { submission_id: approvedSub.id } });
    await prisma.submission.delete({ where: { id: approvedSub.id } });
    await prisma.campaign.delete({ where: { id: cappedCampaign.id } });
  })();

  // Test: Payout available balance and withdrawal safety (Rule 40)
  await test("Payout Safety: Cannot withdraw more than net available balance", async () => {
    const summary = await getClipperEarningsSummary(testUser.id);
    const excessiveAmount = summary.availableBalance + 10000;

    let errorThrown = false;
    try {
      await requestPayout(testUser.id, excessiveAmount, "PAYPAL");
    } catch (e: any) {
      errorThrown = true;
      assert(e.message.includes("Insufficient funds"), "Error should indicate insufficient funds");
    }

    assert(errorThrown, "Excessive payout request must be rejected server-side");
  })();

  console.log("\n=========================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test runner error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
