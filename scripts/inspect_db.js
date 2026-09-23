const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true }
  });
  console.log('=== USERS ===', users);

  const socials = await prisma.socialAccount.findMany();
  console.log('=== SOCIAL ACCOUNTS ===', socials);

  const subs = await prisma.submission.findMany({
    include: {
      user: { select: { username: true } },
      campaign: { select: { id: true, name: true } }
    }
  });
  console.log('=== SUBMISSIONS (' + subs.length + ') ===');
  subs.forEach(s => {
    console.log({
      id: s.id,
      user: s.user?.username,
      campaign: s.campaign?.name,
      platform: s.platform,
      post_url: s.post_url,
      current_views: s.current_views,
      eligible_views: s.eligible_views,
      current_earnings: s.current_earnings,
      status: s.status,
      social_account_id: s.social_account_id
    });
  });

  const campaigns = await prisma.campaign.findMany({
    select: { id: true, name: true, used_budget: true, minimum_views_for_payout: true }
  });
  console.log('=== CAMPAIGNS ===', campaigns);
}

main().catch(console.error).finally(() => prisma.$disconnect());
