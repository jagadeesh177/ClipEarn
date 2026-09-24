import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const REAL_ADMINS = [
  {
    email: "aronyesh63@gmail.com",
    password: "Aron@2006",
    username: "AronAdmin",
    referral_code: "ADMINARON01",
  },
  {
    email: "easalajagadeesh@gmail.com",
    password: "Jazz@2006",
    username: "JagadeeshAdmin",
    referral_code: "ADMINJAZZ01",
  },
];

async function main() {
  console.log("Setting up real Admin accounts...");

  for (const admin of REAL_ADMINS) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    const existing = await prisma.user.findUnique({
      where: { email: admin.email.toLowerCase().trim() },
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: UserRole.ADMIN,
          password_hash: passwordHash,
          status: UserStatus.ACTIVE,
        },
      });
      console.log(`Updated existing user to ADMIN: ${updated.email} (ID: ${updated.id})`);
    } else {
      const created = await prisma.user.create({
        data: {
          email: admin.email.toLowerCase().trim(),
          username: admin.username,
          password_hash: passwordHash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          referral_code: admin.referral_code,
        },
      });
      console.log(`Created new ADMIN user: ${created.email} (ID: ${created.id})`);
    }
  }

  // Reassign relations and remove DemoAdmin & DemoManager from database
  const aronUser = await prisma.user.findUnique({ where: { email: "aronyesh63@gmail.com" } });
  if (aronUser) {
    const demoUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: ["admin@clipearn.com", "manager@clipearn.com", "clipper@clipearn.com"] } },
          { username: { in: ["DemoAdmin", "DemoManager", "DemoClipper"] } },
        ],
      },
    });
    for (const demoUser of demoUsers) {
      await prisma.campaign.updateMany({
        where: { created_by: demoUser.id },
        data: { created_by: aronUser.id },
      });
      await prisma.auditLog.updateMany({
        where: { actor_id: demoUser.id },
        data: { actor_id: aronUser.id },
      });
      await prisma.managerAccessKey.updateMany({
        where: { created_by: demoUser.id },
        data: { created_by: aronUser.id },
      });
      await prisma.managerAccessKey.updateMany({
        where: { used_by: demoUser.id },
        data: { used_by: null, status: "REVOKED" },
      });
      await prisma.user.delete({ where: { id: demoUser.id } }).catch(() => {});
      console.log(`Deleted legacy demo account: ${demoUser.email}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
