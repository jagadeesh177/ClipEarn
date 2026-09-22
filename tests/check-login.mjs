import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["MANAGER", "ADMIN"] } },
  });

  console.log("Found manager/admin users count:", users.length);
  for (const u of users) {
    console.log(`User: ${u.email} | Role: ${u.role} | Status: ${u.status}`);
    if (u.password_hash) {
      const matchManager = await bcrypt.compare("manager123", u.password_hash);
      const matchAdmin = await bcrypt.compare("admin123", u.password_hash);
      console.log(`  Password 'manager123' match: ${matchManager}`);
      console.log(`  Password 'admin123' match: ${matchAdmin}`);
    } else {
      console.log("  NO PASSWORD HASH FOUND!");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
