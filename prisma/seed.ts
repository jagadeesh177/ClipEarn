import { PrismaClient, UserRole, UserStatus, Platform, CampaignStatus, ViewEligibilityMode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ClipEarn database with authorized admins and standard campaigns...");

  const hashedAronPassword = await bcrypt.hash("Aron@2006", 10);
  const hashedJazzPassword = await bcrypt.hash("Jazz@2006", 10);

  // 1. Ensure Authorized Admins exist (safe upsert, preserves existing IDs and references)
  const aronAdmin = await prisma.user.upsert({
    where: { email: "aronyesh63@gmail.com" },
    update: {
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      username: "AronAdmin",
      email: "aronyesh63@gmail.com",
      password_hash: hashedAronPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      referral_code: "ADMINARON01",
    },
  });

  const jazzAdmin = await prisma.user.upsert({
    where: { email: "easalajagadeesh@gmail.com" },
    update: {
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      username: "JagadeeshAdmin",
      email: "easalajagadeesh@gmail.com",
      password_hash: hashedJazzPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      referral_code: "ADMINJAZZ01",
    },
  });

  // 2. Ensure Official Campaigns exist
  const existingSteve = await prisma.campaign.findFirst({
    where: { name: "Steve Wynn #2" },
  });

  if (!existingSteve) {
    await prisma.campaign.create({
      data: {
        name: "Steve Wynn #2",
        brand_name: "Steve Wynn Media",
        description:
          "Create engaging short-form video clips highlighting the key lessons, luxury stories, and entrepreneurial advice from Steve Wynn interviews. Focus on dramatic hooks, clear captions, and high energy.",
        image_url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600",
        status: CampaignStatus.ACTIVE,
        cpm: 1.00,
        total_budget: 10000.00,
        used_budget: 0.00,
        minimum_views_for_payout: 100000,
        maximum_views_per_clip: 2000000,
        allowed_platforms: [Platform.INSTAGRAM, Platform.TIKTOK, Platform.YOUTUBE],
        view_eligibility_mode: ViewEligibilityMode.FROM_SUBMISSION,
        created_by: aronAdmin.id,
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
    console.log("Created Steve Wynn #2 campaign");
  }

  const existingApex = await prisma.campaign.findFirst({
    where: { name: "Apex Energy Drink Launch" },
  });

  if (!existingApex) {
    await prisma.campaign.create({
      data: {
        name: "Apex Energy Drink Launch",
        brand_name: "Apex Nutrition Co.",
        description:
          "High-octane gym, workout, and gaming clips featuring Apex Energy drink product placement, can pop sounds, and energetic lifestyle moments.",
        image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600",
        status: CampaignStatus.ACTIVE,
        cpm: 1.50,
        total_budget: 15000.00,
        used_budget: 0.00,
        minimum_views_for_payout: 50000,
        allowed_platforms: [Platform.TIKTOK, Platform.INSTAGRAM],
        created_by: aronAdmin.id,
        requirements: [
          "Show Apex Energy can prominently in first 3 seconds",
          "Mention zero-sugar & natural caffeine benefits in caption",
          "Include #ApexEnergy and #EnergyBoost",
        ],
        prohibited_content: ["No dangerous stunts", "No underage consumption depiction"],
      },
    });
    console.log("Created Apex Energy Drink Launch campaign");
  }

  const existingCrypto = await prisma.campaign.findFirst({
    where: { name: "CryptoPulse App Tour" },
  });

  if (!existingCrypto) {
    await prisma.campaign.create({
      data: {
        name: "CryptoPulse App Tour",
        brand_name: "CryptoPulse Global",
        description:
          "Educational breakdown of CryptoPulse's zero-fee trading features, AI portfolio alerts, and instant withdrawals.",
        image_url: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600",
        status: CampaignStatus.ACTIVE,
        cpm: 2.00,
        total_budget: 25000.00,
        used_budget: 0.00,
        minimum_views_for_payout: 25000,
        allowed_platforms: [Platform.YOUTUBE, Platform.TIKTOK, Platform.INSTAGRAM],
        created_by: jazzAdmin.id,
        requirements: [
          "Include legal disclaimer: 'Not financial advice' in caption",
          "Highlight security & non-custodial wallet features",
          "Tag #CryptoPulse and link in bio",
        ],
        prohibited_content: ["No price pump guarantees", "No financial promises"],
      },
    });
    console.log("Created CryptoPulse App Tour campaign");
  }

  console.log("Database initialized safely with authorized admins and active campaigns!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
