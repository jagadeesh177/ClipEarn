import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Starting deletion of all submissions...\n");

  // Count before
  const count = await prisma.submission.count();
  console.log(`📊 Found ${count} submissions to delete.`);

  await prisma.$transaction(async (tx) => {
    // 1. Delete view snapshots
    const snaps = await tx.viewSnapshot.deleteMany({});
    console.log(`✅ Deleted ${snaps.count} view snapshots.`);

    // 2. Delete fraud flags
    const fraud = await tx.fraudFlag.deleteMany({});
    console.log(`✅ Deleted ${fraud.count} fraud flags.`);

    // 3. Delete all submissions
    const subs = await tx.submission.deleteMany({});
    console.log(`✅ Deleted ${subs.count} submissions.`);

    // 4. Reset used_budget on all campaigns to 0
    const camps = await tx.campaign.updateMany({
      data: { used_budget: 0 },
    });
    console.log(`✅ Reset used_budget to $0 on ${camps.count} campaigns.`);
  });

  console.log("\n🎉 All submissions deleted successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
