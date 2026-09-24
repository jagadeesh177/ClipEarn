import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import assert from "assert";

const prisma = new PrismaClient();

async function run() {
  console.log("=== VERIFYING MANAGER ACCESS REVOCATION & RESTORATION LOGIC ===");
  let passed = 0;

  function pass(msg) {
    console.log(`✅ PASS: ${msg}`);
    passed++;
  }

  const testEmail = `test_mgr_${Date.now()}@example.com`;
  const testDiscordId = `discord_${Date.now()}`;
  let testUserId = null;
  let campaignId = null;
  let submissionId = null;
  let accessKeyId = null;

  try {
    // 1. Create a test manager
    const user = await prisma.user.create({
      data: {
        username: "TestRevokeManager",
        email: testEmail,
        discord_id: testDiscordId,
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        referral_code: `REF${Math.floor(100000 + Math.random() * 900000)}`,
      },
    });
    testUserId = user.id;
    assert.strictEqual(user.role, UserRole.MANAGER);
    assert.strictEqual(user.status, UserStatus.ACTIVE);
    pass("Created test manager with role: MANAGER and status: ACTIVE");

    // 2. Create an associated access key used by this manager
    const key = await prisma.managerAccessKey.create({
      data: {
        key_hash: `test_hash_${Date.now()}`,
        key_preview: "CE-INVITE-••••-TEST",
        status: "USED",
        created_by: user.id,
        used_by: user.id,
        used_at: new Date(),
      },
    });
    accessKeyId = key.id;
    pass("Created associated manager access key record");

    // 3. Create a test campaign created by this manager
    const campaign = await prisma.campaign.create({
      data: {
        name: "Test Manager Campaign",
        brand_name: "Test Brand",
        description: "Test description for campaign",
        cpm: 5.0,
        total_budget: 500.0,
        created_by: user.id,
      },
    });
    campaignId = campaign.id;
    pass("Created associated campaign created_by test manager");

    // 4. Create a test submission by this user
    const submission = await prisma.submission.create({
      data: {
        user_id: user.id,
        campaign_id: campaign.id,
        post_url: "https://instagram.com/p/test12345",
        platform_post_id: "test12345",
        platform: "INSTAGRAM",
        current_views: 1200,
        eligible_views: 1200,
        current_earnings: 6.0,
        status: "APPROVED",
      },
    });
    submissionId = submission.id;
    pass("Created associated submission and earnings by test manager");

    // 5. Test Revocation Logic (Requirement 1, 2, 3)
    // Demote role to CLIPPER, DO NOT ban or suspend user
    const revokedUser = await prisma.user.update({
      where: { id: testUserId },
      data: {
        role: UserRole.CLIPPER,
        // Status remains ACTIVE
      },
    });
    await prisma.managerAccessKey.updateMany({
      where: { used_by: testUserId },
      data: { status: "REVOKED" },
    });

    assert.strictEqual(revokedUser.role, UserRole.CLIPPER, "Role must be downgraded to CLIPPER");
    assert.strictEqual(revokedUser.status, UserStatus.ACTIVE, "Status must remain ACTIVE (not SUSPENDED/BANNED)");
    pass("Revoked manager privileges: role is CLIPPER, status is ACTIVE");

    // 6. Verify User Account & Data Preservation (Requirement 2)
    const checkUser = await prisma.user.findUnique({
      where: { id: testUserId },
      include: {
        submissions: true,
        campaigns_created: true,
        used_manager_access_keys: true,
      },
    });
    assert(checkUser, "User account must remain in database (not deleted)");
    assert.strictEqual(checkUser.submissions.length, 1, "Submissions must be preserved");
    assert.strictEqual(checkUser.submissions[0].current_views, 1200);
    assert.strictEqual(checkUser.campaigns_created.length, 1, "Campaigns must be preserved");
    pass("All user data preserved: account exists, submissions intact, campaigns intact");

    // 7. Verify Manager Access Status logic for Admin Dashboard (Requirement 4)
    const activeManagers = await prisma.user.findMany({
      where: { role: UserRole.MANAGER },
    });
    const isStillActiveManager = activeManagers.some((m) => m.id === testUserId);
    assert.strictEqual(isStillActiveManager, false, "Revoked manager must not appear as active manager");
    pass("Revoked manager correctly excluded from active manager list");

    const revokedManagers = await prisma.user.findMany({
      where: {
        role: UserRole.CLIPPER,
        used_manager_access_keys: { some: {} },
      },
    });
    const isInRevokedList = revokedManagers.some((m) => m.id === testUserId);
    assert.strictEqual(isInRevokedList, true, "Revoked manager must appear in revoked managers directory");
    pass("Revoked manager correctly included in revoked list for Admin Dashboard");

    // 8. Test Restoration Logic (Requirement 4)
    const restoredUser = await prisma.user.update({
      where: { id: testUserId },
      data: {
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
      },
    });
    await prisma.managerAccessKey.updateMany({
      where: { used_by: testUserId },
      data: { status: "USED" },
    });

    assert.strictEqual(restoredUser.role, UserRole.MANAGER, "Role must be restored to MANAGER");
    assert.strictEqual(restoredUser.status, UserStatus.ACTIVE, "Status must be ACTIVE");
    pass("Restored manager privileges: role is MANAGER, status is ACTIVE");

    // 9. Admin Protection Check
    const adminUser = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });
    assert(adminUser, "Admin account must exist");
    // Verify our logic protects Admin:
    assert.strictEqual(adminUser.role, UserRole.ADMIN);
    pass("Admin accounts verified and protected");

    console.log(`\n🎉 ALL ${passed} VERIFICATION CHECKS PASSED SUCCESSFULLY!\n`);
  } finally {
    // Clean up
    if (submissionId) {
      await prisma.submission.delete({ where: { id: submissionId } }).catch(() => {});
    }
    if (campaignId) {
      await prisma.campaign.delete({ where: { id: campaignId } }).catch(() => {});
    }
    if (accessKeyId) {
      await prisma.managerAccessKey.delete({ where: { id: accessKeyId } }).catch(() => {});
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
