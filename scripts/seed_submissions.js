const { PrismaClient, Platform, SubmissionStatus, VerificationStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clipper social accounts, submissions, and earnings...');

  // 1. Get DemoClipper and campaigns
  const demoClipper = await prisma.user.findFirst({
    where: { email: 'clipper@clipearn.com' }
  });
  if (!demoClipper) {
    console.error('DemoClipper user not found!');
    return;
  }

  const campaigns = await prisma.campaign.findMany();
  if (campaigns.length === 0) {
    console.error('No campaigns found!');
    return;
  }

  // 2. Ensure DemoClipper has verified social accounts
  const tiktokAccount = await prisma.socialAccount.upsert({
    where: {
      platform_platform_user_id: {
        platform: Platform.TIKTOK,
        platform_user_id: 'tt_democlipper'
      }
    },
    update: {
      user_id: demoClipper.id,
      username: 'democlipper_official',
      verification_status: VerificationStatus.VERIFIED,
      verified_at: new Date()
    },
    create: {
      user_id: demoClipper.id,
      platform: Platform.TIKTOK,
      platform_user_id: 'tt_democlipper',
      username: 'democlipper_official',
      profile_url: 'https://tiktok.com/@democlipper_official',
      verification_status: VerificationStatus.VERIFIED,
      verified_at: new Date()
    }
  });

  const instaAccount = await prisma.socialAccount.upsert({
    where: {
      platform_platform_user_id: {
        platform: Platform.INSTAGRAM,
        platform_user_id: 'ig_democlipper'
      }
    },
    update: {
      user_id: demoClipper.id,
      username: 'democlipper_reels',
      verification_status: VerificationStatus.VERIFIED,
      verified_at: new Date()
    },
    create: {
      user_id: demoClipper.id,
      platform: Platform.INSTAGRAM,
      platform_user_id: 'ig_democlipper',
      username: 'democlipper_reels',
      profile_url: 'https://instagram.com/democlipper_reels',
      verification_status: VerificationStatus.VERIFIED,
      verified_at: new Date()
    }
  });

  const ytAccount = await prisma.socialAccount.upsert({
    where: {
      platform_platform_user_id: {
        platform: Platform.YOUTUBE,
        platform_user_id: 'yt_democlipper'
      }
    },
    update: {
      user_id: demoClipper.id,
      username: 'democlipper_shorts',
      verification_status: VerificationStatus.VERIFIED,
      verified_at: new Date()
    },
    create: {
      user_id: demoClipper.id,
      platform: Platform.YOUTUBE,
      platform_user_id: 'yt_democlipper',
      username: 'democlipper_shorts',
      profile_url: 'https://youtube.com/@democlipper_shorts',
      verification_status: VerificationStatus.VERIFIED,
      verified_at: new Date()
    }
  });

  console.log('Social accounts ready for DemoClipper.');

  // 3. Ensure Campaign Memberships for DemoClipper
  for (const camp of campaigns) {
    await prisma.campaignMembership.upsert({
      where: {
        campaign_id_user_id: {
          campaign_id: camp.id,
          user_id: demoClipper.id
        }
      },
      update: {},
      create: {
        campaign_id: camp.id,
        user_id: demoClipper.id
      }
    });
  }

  // 4. Seed Submissions across campaigns
  // For CryptoPulse App Tour
  const cryptoPulse = campaigns.find(c => c.name.includes('CryptoPulse')) || campaigns[0];
  const apexCampaign = campaigns.find(c => c.name.includes('Apex')) || campaigns[1] || campaigns[0];

  const demoSubmissionsData = [
    {
      campaign_id: cryptoPulse.id,
      user_id: demoClipper.id,
      social_account_id: tiktokAccount.id,
      platform: Platform.TIKTOK,
      post_url: 'https://www.tiktok.com/@democlipper_official/video/7345678901234567891',
      platform_post_id: '7345678901234567891',
      status: SubmissionStatus.APPROVED,
      current_views: 620500,
      eligible_views: 620500,
      paid_views: 0,
      current_earnings: (620.5 * Number(cryptoPulse.cpm)).toFixed(2),
      reviewed_at: new Date(Date.now() - 5 * 86400000),
      created_at: new Date(Date.now() - 7 * 86400000)
    },
    {
      campaign_id: cryptoPulse.id,
      user_id: demoClipper.id,
      social_account_id: ytAccount.id,
      platform: Platform.YOUTUBE,
      post_url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      platform_post_id: 'dQw4w9WgXcQ',
      status: SubmissionStatus.APPROVED,
      current_views: 384000,
      eligible_views: 384000,
      paid_views: 0,
      current_earnings: (384 * Number(cryptoPulse.cpm)).toFixed(2),
      reviewed_at: new Date(Date.now() - 3 * 86400000),
      created_at: new Date(Date.now() - 4 * 86400000)
    },
    {
      campaign_id: cryptoPulse.id,
      user_id: demoClipper.id,
      social_account_id: instaAccount.id,
      platform: Platform.INSTAGRAM,
      post_url: 'https://www.instagram.com/reel/C38x9201984/',
      platform_post_id: 'C38x9201984',
      status: SubmissionStatus.PENDING,
      current_views: 45200,
      eligible_views: 0,
      paid_views: 0,
      current_earnings: 0.00,
      created_at: new Date(Date.now() - 1 * 86400000)
    },
    {
      campaign_id: apexCampaign.id,
      user_id: demoClipper.id,
      social_account_id: tiktokAccount.id,
      platform: Platform.TIKTOK,
      post_url: 'https://www.tiktok.com/@democlipper_official/video/7398123456789012345',
      platform_post_id: '7398123456789012345',
      status: SubmissionStatus.APPROVED,
      current_views: 410000,
      eligible_views: 410000,
      paid_views: 0,
      current_earnings: (410 * Number(apexCampaign.cpm)).toFixed(2),
      reviewed_at: new Date(Date.now() - 2 * 86400000),
      created_at: new Date(Date.now() - 3 * 86400000)
    }
  ];

  for (const s of demoSubmissionsData) {
    const existing = await prisma.submission.findUnique({
      where: {
        campaign_id_platform_platform_post_id: {
          campaign_id: s.campaign_id,
          platform: s.platform,
          platform_post_id: s.platform_post_id
        }
      }
    });

    let subRecord;
    if (existing) {
      subRecord = await prisma.submission.update({
        where: { id: existing.id },
        data: s
      });
    } else {
      subRecord = await prisma.submission.create({
        data: s
      });
    }

    // Create snapshots
    await prisma.viewSnapshot.create({
      data: {
        submission_id: subRecord.id,
        views: subRecord.current_views,
        captured_at: new Date()
      }
    });

    // If approved, create earnings ledger entry
    if (subRecord.status === SubmissionStatus.APPROVED && Number(subRecord.current_earnings) > 0) {
      await prisma.earningsLedger.create({
        data: {
          user_id: subRecord.user_id,
          campaign_id: subRecord.campaign_id,
          submission_id: subRecord.id,
          rate_per_1000: cryptoPulse.cpm,
          amount: subRecord.current_earnings,
          views: subRecord.eligible_views,
          event_type: 'VIEW_SYNC'
        }
      });
    }
  }

  // 5. Also seed submissions for other clippers (Sriraam, Piyush, Mohit) to populate Leaderboard
  const otherClippers = await prisma.user.findMany({
    where: {
      role: 'CLIPPER',
      id: { not: demoClipper.id }
    },
    take: 3
  });

  const otherSubmissionsData = [
    {
      userIndex: 0,
      campaign_id: cryptoPulse.id,
      platform: Platform.TIKTOK,
      post_url: 'https://www.tiktok.com/@sriraam_clips/video/7311111111111111111',
      platform_post_id: '7311111111111111111',
      current_views: 890000,
      eligible_views: 890000,
      cpm: Number(cryptoPulse.cpm)
    },
    {
      userIndex: 1,
      campaign_id: cryptoPulse.id,
      platform: Platform.TIKTOK,
      post_url: 'https://www.tiktok.com/@piyush_clips/video/7322222222222222222',
      platform_post_id: '7322222222222222222',
      current_views: 520000,
      eligible_views: 520000,
      cpm: Number(cryptoPulse.cpm)
    },
    {
      userIndex: 2,
      campaign_id: cryptoPulse.id,
      platform: Platform.TIKTOK,
      post_url: 'https://www.tiktok.com/@mohit_clips/video/7333333333333333333',
      platform_post_id: '7333333333333333333',
      current_views: 310000,
      eligible_views: 310000,
      cpm: Number(cryptoPulse.cpm)
    }
  ];

  for (const item of otherSubmissionsData) {
    const user = otherClippers[item.userIndex];
    if (!user) continue;

    // Membership
    await prisma.campaignMembership.upsert({
      where: {
        campaign_id_user_id: {
          campaign_id: item.campaign_id,
          user_id: user.id
        }
      },
      update: {},
      create: {
        campaign_id: item.campaign_id,
        user_id: user.id
      }
    });

    const sub = await prisma.submission.upsert({
      where: {
        campaign_id_platform_platform_post_id: {
          campaign_id: item.campaign_id,
          platform: item.platform,
          platform_post_id: item.platform_post_id
        }
      },
      update: {
        status: SubmissionStatus.APPROVED,
        current_views: item.current_views,
        eligible_views: item.eligible_views,
        current_earnings: (item.eligible_views / 1000 * item.cpm).toFixed(2)
      },
      create: {
        campaign_id: item.campaign_id,
        user_id: user.id,
        platform: item.platform,
        post_url: item.post_url,
        platform_post_id: item.platform_post_id,
        status: SubmissionStatus.APPROVED,
        current_views: item.current_views,
        eligible_views: item.eligible_views,
        current_earnings: (item.eligible_views / 1000 * item.cpm).toFixed(2)
      }
    });

    await prisma.earningsLedger.create({
      data: {
        user_id: user.id,
        campaign_id: item.campaign_id,
        submission_id: sub.id,
        rate_per_1000: item.cpm,
        amount: sub.current_earnings,
        views: sub.eligible_views,
        event_type: 'VIEW_SYNC'
      }
    });
  }

  // 6. Recalculate campaign budget used and total views
  for (const camp of campaigns) {
    const approvedSubs = await prisma.submission.findMany({
      where: {
        campaign_id: camp.id,
        status: SubmissionStatus.APPROVED
      }
    });

    const totalViews = approvedSubs.reduce((acc, s) => acc + s.current_views, 0);
    const totalEarnings = approvedSubs.reduce((acc, s) => acc + Number(s.current_earnings), 0);

    const minViews = camp.minimum_views_for_payout || 0;
    const hasReachedMinViews = minViews > 0 ? totalViews >= minViews : true;
    const usedBudget = hasReachedMinViews ? totalEarnings : 0;

    await prisma.campaign.update({
      where: { id: camp.id },
      data: {
        used_budget: usedBudget
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
