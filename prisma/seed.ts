import { PrismaClient, UserRole, UserStatus, Platform, VerificationStatus, CampaignStatus, ViewEligibilityMode, SubmissionStatus, PayoutStatus, ReferralStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ClipEarn database...");

  // Clear existing data in reverse order of dependencies
  await prisma.fraudFlag.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.earningsLedger.deleteMany({});
  await prisma.viewSnapshot.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.campaignMembership.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.socialAccount.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedManagerPassword = await bcrypt.hash("manager123", 10);
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      username: "DemoAdmin",
      email: "admin@clipearn.com",
      password_hash: hashedAdminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      referral_code: "ADMIN001",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });

  // 2. Create Manager
  const manager = await prisma.user.create({
    data: {
      username: "DemoManager",
      email: "manager@clipearn.com",
      password_hash: hashedManagerPassword,
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      referral_code: "MGR001",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  });

  // 3. Create Demo Clipper
  const demoClipper = await prisma.user.create({
    data: {
      discord_id: "123456789012345678",
      username: "DemoClipper",
      email: "clipper@clipearn.com",
      role: UserRole.CLIPPER,
      status: UserStatus.ACTIVE,
      referral_code: "CLIPDEMO",
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    },
  });

  // 4. Create Leaderboard Clippers
  const clippersData = [
    { username: "Sriraam", discord_id: "900000000000000001", code: "SRIRAAM1" },
    { username: "PIYUSH", discord_id: "900000000000000002", code: "PIYUSH02" },
    { username: "Mohit", discord_id: "900000000000000003", code: "MOHIT003" },
    { username: "Andrew", discord_id: "900000000000000004", code: "ANDREW04" },
    { username: "Kryo", discord_id: "900000000000000005", code: "KRYO0005" },
  ];

  const createdClippers: any[] = [];
  for (const c of clippersData) {
    const user = await prisma.user.create({
      data: {
        discord_id: c.discord_id,
        username: c.username,
        email: `${c.username.toLowerCase()}@clippers.net`,
        role: UserRole.CLIPPER,
        status: UserStatus.ACTIVE,
        referral_code: c.code,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${c.username}`,
      },
    });
    createdClippers.push(user);
  }

  // 5. Connect Social Accounts for Demo Clipper
  const demoTikTok = await prisma.socialAccount.create({
    data: {
      user_id: demoClipper.id,
      platform: Platform.TIKTOK,
      platform_user_id: "tt_democlipper_99",
      username: "democlipper_tt",
      profile_url: "https://tiktok.com/@democlipper_tt",
      verification_status: VerificationStatus.VERIFIED,
      verified_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      verification_code: "clipearn-verified-01",
    },
  });

  const demoInstagram = await prisma.socialAccount.create({
    data: {
      user_id: demoClipper.id,
      platform: Platform.INSTAGRAM,
      platform_user_id: "ig_democlipper_88",
      username: "democlipper_ig",
      profile_url: "https://instagram.com/democlipper_ig",
      verification_status: VerificationStatus.VERIFIED,
      verified_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      verification_code: "clipearn-verified-02",
    },
  });

  const demoYouTube = await prisma.socialAccount.create({
    data: {
      user_id: demoClipper.id,
      platform: Platform.YOUTUBE,
      platform_user_id: "yt_democlipper_77",
      username: "DemoClipperShorts",
      profile_url: "https://youtube.com/@DemoClipperShorts",
      verification_status: VerificationStatus.PENDING,
      verification_code: "clipearn-81fa2b",
    },
  });

  // Social accounts for leaderboard clippers
  const clipperAccounts: any[] = [];
  for (const c of createdClippers) {
    const acc = await prisma.socialAccount.create({
      data: {
        user_id: c.id,
        platform: Platform.TIKTOK,
        platform_user_id: `tt_${c.username.toLowerCase()}`,
        username: `${c.username.toLowerCase()}_clips`,
        profile_url: `https://tiktok.com/@${c.username.toLowerCase()}_clips`,
        verification_status: VerificationStatus.VERIFIED,
        verified_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });
    clipperAccounts.push({ clipper: c, account: acc });
  }

  // 6. Create Campaigns
  // Primary Reference Campaign: Steve Wynn #2
  const steveWynnCampaign = await prisma.campaign.create({
    data: {
      name: "Steve Wynn #2",
      brand_name: "Steve Wynn Media",
      description:
        "Create engaging short-form video clips highlighting the key lessons, luxury stories, and entrepreneurial advice from Steve Wynn interviews. Focus on dramatic hooks, clear captions, and high energy.",
      image_url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600",
      status: CampaignStatus.ACTIVE,
      cpm: 1.00,
      total_budget: 10000.00,
      used_budget: 122.02,
      minimum_views_for_payout: 100000,
      maximum_views_per_clip: 2000000,
      allowed_platforms: [Platform.INSTAGRAM, Platform.TIKTOK, Platform.YOUTUBE],
      view_eligibility_mode: ViewEligibilityMode.FROM_SUBMISSION,
      created_by: manager.id,
      requirements: [
        "Minimum 30 seconds length, maximum 90 seconds",
        "Include #SteveWynn and #BusinessStrategy in caption",
        "Must be vertical 9:16 high-definition video (1080x1920)",
        "Clear audio with readable dynamic animated captions",
        "Video must be posted on your verified connected account",
      ],
      prohibited_content: [
        "No vulgar, discriminatory, or offensive language",
        "No robotic AI voices with unedited stock footage",
        "No misleading titles or scam/giveaway promises",
        "Do not alter brand logos or claim personal association",
      ],
    },
  });

  const apexEnergyCampaign = await prisma.campaign.create({
    data: {
      name: "Apex Energy Drink Launch",
      brand_name: "Apex Nutrition Co.",
      description:
        "High-octane gym, workout, and gaming clips featuring Apex Energy drink product placement, can pop sounds, and energetic lifestyle moments.",
      image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600",
      status: CampaignStatus.ACTIVE,
      cpm: 1.50,
      total_budget: 15000.00,
      used_budget: 3450.00,
      minimum_views_for_payout: 50000,
      allowed_platforms: [Platform.TIKTOK, Platform.INSTAGRAM],
      created_by: manager.id,
      requirements: [
        "Show Apex Energy can prominently in first 3 seconds",
        "Mention zero-sugar & natural caffeine benefits in caption",
        "Include #ApexEnergy and #EnergyBoost",
      ],
      prohibited_content: ["No dangerous stunts", "No underage consumption depiction"],
    },
  });

  const cryptoPulseCampaign = await prisma.campaign.create({
    data: {
      name: "CryptoPulse App Tour",
      brand_name: "CryptoPulse Global",
      description:
        "Educational breakdown of CryptoPulse's zero-fee trading features, AI portfolio alerts, and instant withdrawals.",
      image_url: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600",
      status: CampaignStatus.ACTIVE,
      cpm: 2.00,
      total_budget: 25000.00,
      used_budget: 8940.00,
      minimum_views_for_payout: 25000,
      allowed_platforms: [Platform.YOUTUBE, Platform.TIKTOK, Platform.INSTAGRAM],
      created_by: manager.id,
      requirements: [
        "Include legal disclaimer: 'Not financial advice' in caption",
        "Highlight security & non-custodial wallet features",
        "Tag #CryptoPulse and link in bio",
      ],
      prohibited_content: ["No price pump guarantees", "No financial promises"],
    },
  });

  // 7. Join Campaign Memberships
  await prisma.campaignMembership.createMany({
    data: [
      { campaign_id: steveWynnCampaign.id, user_id: demoClipper.id },
      { campaign_id: apexEnergyCampaign.id, user_id: demoClipper.id },
      { campaign_id: cryptoPulseCampaign.id, user_id: demoClipper.id },
      ...createdClippers.map((c) => ({
        campaign_id: steveWynnCampaign.id,
        user_id: c.id,
      })),
    ],
  });

  // 8. Create Submissions & Snapshots & Ledger for Steve Wynn Campaign
  // Submissions for leaderboard clippers (matching user prompt: Sriraam 122,020 views, PIYUSH, Mohit, Andrew, Kryo)
  const leaderboardStats = [
    { index: 0, views: 122020, eligible: 122020, earnings: 122.02 },
    { index: 1, views: 36430, eligible: 36430, earnings: 0.00 }, // Below 100k min threshold for payout
    { index: 2, views: 35066, eligible: 35066, earnings: 0.00 },
    { index: 3, views: 27391, eligible: 27391, earnings: 0.00 },
    { index: 4, views: 20556, eligible: 20556, earnings: 0.00 },
  ];

  for (const item of leaderboardStats) {
    const clipperObj = clipperAccounts[item.index];
    const sub = await prisma.submission.create({
      data: {
        campaign_id: steveWynnCampaign.id,
        user_id: clipperObj.clipper.id,
        social_account_id: clipperObj.account.id,
        platform: Platform.TIKTOK,
        post_url: `https://www.tiktok.com/@${clipperObj.account.username}/video/731000000000000000${item.index}`,
        platform_post_id: `731000000000000000${item.index}`,
        status: SubmissionStatus.APPROVED,
        submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        reviewed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        reviewed_by: manager.id,
        current_views: item.views,
        eligible_views: item.eligible,
        current_earnings: item.earnings,
        last_view_update: new Date(),
        last_sync_status: "SUCCESS",
      },
    });

    // Snapshots
    await prisma.viewSnapshot.createMany({
      data: [
        { submission_id: sub.id, views: Math.floor(item.views * 0.2), captured_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        { submission_id: sub.id, views: Math.floor(item.views * 0.5), captured_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { submission_id: sub.id, views: Math.floor(item.views * 0.8), captured_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { submission_id: sub.id, views: item.views, captured_at: new Date() },
      ],
    });

    if (item.earnings > 0) {
      await prisma.earningsLedger.create({
        data: {
          user_id: clipperObj.clipper.id,
          campaign_id: steveWynnCampaign.id,
          submission_id: sub.id,
          views: item.eligible,
          rate_per_1000: 1.00,
          amount: item.earnings,
        },
      });
    }
  }

  // 9. Submissions for Demo Clipper
  // Approved Clip on TikTok
  const demoApprovedSub = await prisma.submission.create({
    data: {
      campaign_id: steveWynnCampaign.id,
      user_id: demoClipper.id,
      social_account_id: demoTikTok.id,
      platform: Platform.TIKTOK,
      post_url: "https://www.tiktok.com/@democlipper_tt/video/7398123456789012345",
      platform_post_id: "7398123456789012345",
      status: SubmissionStatus.APPROVED,
      submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      reviewed_by: manager.id,
      current_views: 125420,
      eligible_views: 120000,
      current_earnings: 120.00,
      last_view_update: new Date(Date.now() - 2 * 60 * 60 * 1000),
      last_sync_status: "SUCCESS",
    },
  });

  // Snapshots for Demo Clipper
  await prisma.viewSnapshot.createMany({
    data: [
      { submission_id: demoApprovedSub.id, views: 5420, captured_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { submission_id: demoApprovedSub.id, views: 35000, captured_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { submission_id: demoApprovedSub.id, views: 78000, captured_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { submission_id: demoApprovedSub.id, views: 125420, captured_at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    ],
  });

  await prisma.earningsLedger.create({
    data: {
      user_id: demoClipper.id,
      campaign_id: steveWynnCampaign.id,
      submission_id: demoApprovedSub.id,
      views: 120000,
      rate_per_1000: 1.00,
      amount: 120.00,
    },
  });

  // Pending Clip for Demo Clipper (waiting manager review)
  await prisma.submission.create({
    data: {
      campaign_id: steveWynnCampaign.id,
      user_id: demoClipper.id,
      social_account_id: demoInstagram.id,
      platform: Platform.INSTAGRAM,
      post_url: "https://www.instagram.com/reel/C8XYZ123abc/",
      platform_post_id: "C8XYZ123abc",
      status: SubmissionStatus.PENDING,
      submitted_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
      current_views: 18450,
      eligible_views: 0,
      current_earnings: 0.00,
    },
  });

  // Rejected Clip for Demo Clipper
  await prisma.submission.create({
    data: {
      campaign_id: apexEnergyCampaign.id,
      user_id: demoClipper.id,
      social_account_id: demoTikTok.id,
      platform: Platform.TIKTOK,
      post_url: "https://www.tiktok.com/@democlipper_tt/video/7391112223334445555",
      platform_post_id: "7391112223334445555",
      status: SubmissionStatus.REJECTED,
      submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      reviewed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reviewed_by: manager.id,
      rejection_reason: "Campaign requirement not followed: Missing #ApexEnergy hashtag and product can is obscured.",
      current_views: 4500,
      eligible_views: 0,
      current_earnings: 0.00,
    },
  });

  // 10. Sample Payouts for Demo Clipper
  await prisma.payout.create({
    data: {
      user_id: demoClipper.id,
      amount: 50.00,
      currency: "USD",
      method: "PAYPAL",
      status: PayoutStatus.PAID,
      transaction_id: "PAY-983719230912",
      requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      processed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // 11. Sample Notifications
  await prisma.notification.createMany({
    data: [
      {
        user_id: demoClipper.id,
        type: "SUBMISSION_APPROVED",
        title: "Clip Approved! 🎉",
        message: "Your submission for Steve Wynn #2 has been approved and is now tracking views & earnings.",
        read_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: demoClipper.id,
        type: "PAYOUT_PROCESSED",
        title: "Payout Sent ($50.00)",
        message: "Your PayPal payout of $50.00 has been completed with transaction ID PAY-983719230912.",
        read_at: null,
      },
      {
        user_id: demoClipper.id,
        type: "SUBMISSION_REJECTED",
        title: "Submission Rejected",
        message: "Apex Energy Drink clip was rejected: Missing #ApexEnergy hashtag.",
        read_at: null,
      },
    ],
  });

  // 12. Referral Record
  await prisma.referral.create({
    data: {
      referrer_id: demoClipper.id,
      referred_user_id: createdClippers[0].id,
      referral_code: "CLIPDEMO",
      status: ReferralStatus.QUALIFIED,
      qualified_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // 13. Audit Log
  await prisma.auditLog.create({
    data: {
      actor_id: manager.id,
      action: "CAMPAIGN_CREATED",
      target_type: "CAMPAIGN",
      target_id: steveWynnCampaign.id,
      new_value: { name: steveWynnCampaign.name, budget: 10000, cpm: 1 },
    },
  });

  console.log("Database seeded successfully!");
  console.log("Credentials:");
  console.log("  Clipper: Demo Login button on /login or Discord OAuth");
  console.log("  Manager: manager@clipearn.com / manager123 on /manager/login");
  console.log("  Admin:   admin@clipearn.com / admin123 on /manager/login");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
