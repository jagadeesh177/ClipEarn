import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true,
      password_hash: true,
      _count: {
        select: {
          campaigns_created: true,
          audit_logs: true,
          submissions: true,
          payouts: true,
          campaign_memberships: true,
        },
      },
    },
  });
  console.log("All users in DB with relations:");
  for (const u of users) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, User: ${u.username}, Role: ${u.role}, Counts: ${JSON.stringify(u._count)}`);
  }
}
main().finally(() => prisma.$disconnect());

