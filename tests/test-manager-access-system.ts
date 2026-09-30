import assert from "assert";
import { prisma } from "../src/lib/prisma";
import { POST as adminGenKeyPOST } from "../src/app/api/admin/manager-access-keys/route";
import { POST as validateKeyPOST } from "../src/app/api/auth/manager-access-key/validate/route";
import { GET as discordAuthGET } from "../src/app/api/auth/discord/route";
import { GET as discordCallbackGET } from "../src/app/api/auth/discord/callback/route";
import { GET as meGET } from "../src/app/api/auth/me/route";
import { GET as managerDashboardGET } from "../src/app/api/manager/dashboard/route";
import { signSessionToken, COOKIE_NAME } from "../src/lib/auth";
import { UserRole } from "@prisma/client";
import { PREAUTH_COOKIE_NAME } from "../src/lib/managerAccessKey";

let passed = 0;
let failed = 0;

function testPass(msg: string) {
  console.log(`  ✔ PASS: ${msg}`);
  passed++;
}

function testFail(msg: string, err?: any) {
  console.error(`  ✖ FAIL: ${msg}`);
  if (err) console.error(err);
  failed++;
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   MANAGER ACCESS CODE & INVITATION SYSTEM TEST SUITE  ");
  console.log("=======================================================\n");

  // Setup: Find or verify real Admin account
  let admin = await prisma.user.findFirst({
    where: { email: "aronyesh63@gmail.com", role: UserRole.ADMIN },
  });
  assert(admin, "Real admin (aronyesh63@gmail.com) must exist in DB");

  const adminToken = signSessionToken({
    userId: admin.id,
    role: UserRole.ADMIN,
    username: admin.username,
    email: admin.email,
  });
  const adminCookie = `${COOKIE_NAME}=${adminToken}`;
  (globalThis as any).__mockCookieStore = { [COOKIE_NAME]: adminToken };

  // ------------------------------------------------------------------
  // TEST 1 & TEST 3: Admin generates code -> Verified in Neon DB -> Manager validates
  // ------------------------------------------------------------------
  console.log("--- TEST 1 & 3: Admin Generates Code & Verifies Neon DB Record ---");
  const genReq = new Request("http://localhost:3000/api/admin/manager-access-keys", {
    method: "POST",
    headers: {
      cookie: adminCookie,
    },
  });

  const genRes = await adminGenKeyPOST(genReq);
  assert.strictEqual(genRes.status, 201, "Admin key generation must return HTTP 201");
  const genData = await genRes.json();
  assert.strictEqual(genData.success, true);
  const plainCode = genData.code || genData.key || genData.plaintextKey;
  assert(plainCode && plainCode.startsWith("CE-INVITE-"), `Generated code must start with CE-INVITE- (got ${plainCode})`);
  assert.strictEqual(plainCode.length, 18, `Generated code must be 18 chars (got ${plainCode})`);

  // Verify DB state in Neon PostgreSQL
  const dbRecord = await prisma.managerAccessKey.findUnique({
    where: { id: genData.accessKey.id },
  });
  assert(dbRecord, "Access code record must exist in Neon PostgreSQL database");
  assert.strictEqual(dbRecord.status, "ACTIVE", "New code status in DB must be ACTIVE");
  assert.strictEqual(dbRecord.used_by, null, "used_by must be null initially");
  assert.strictEqual(dbRecord.used_at, null, "used_at must be null initially");
  testPass(`Admin generated valid code ${plainCode} and verified in Neon database`);

  // Manager enters code on /manager/login -> POST /api/auth/manager-access-key/validate
  console.log("\n--- Manager Access Code Validation (Tolerance & Pre-Auth Ticket) ---");
  // Test with lowercase and extra whitespace
  const valReq = new Request("http://localhost:3000/api/auth/manager-access-key/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: `  ${plainCode.toLowerCase()} \n `,
      accessKey: `  ${plainCode.toLowerCase()} \n `,
    }),
  });

  const valRes = await validateKeyPOST(valReq);
  const valData = await valRes.json();
  assert.strictEqual(valRes.status, 200, "Validation must return HTTP 200 for valid code");
  assert.strictEqual(valData.success, true);
  assert.strictEqual(valData.valid, true);
  assert(valData.ticket, "Response must include signed pre-auth ticket");
  const preauthTicket = valData.ticket;
  testPass("Manager validated code with whitespace/lowercase tolerance and received pre-auth ticket");

  // ------------------------------------------------------------------
  // TEST 2: Invalid code rejection
  // ------------------------------------------------------------------
  console.log("\n--- TEST 2: Invalid Code Rejection ---");
  const invalidReq = new Request("http://localhost:3000/api/auth/manager-access-key/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "CE-INVITE-INVALID99",
      accessKey: "CE-INVITE-INVALID99",
    }),
  });
  const invalidRes = await validateKeyPOST(invalidReq);
  const invalidData = await invalidRes.json();
  assert.strictEqual(invalidRes.status, 400, "Invalid code must return HTTP 400");
  assert.strictEqual(invalidData.valid, false);
  assert.strictEqual(
    invalidData.error,
    "Invalid manager access code",
    `Error must be 'Invalid manager access code' (got '${invalidData.error}')`
  );
  testPass("Invalid code rejected with exact message: 'Invalid manager access code'");

  // ------------------------------------------------------------------
  // TEST 1 Continued: Discord OAuth -> Callback -> Manager Account Creation (role = MANAGER)
  // ------------------------------------------------------------------
  console.log("\n--- Completing Discord OAuth -> Manager Account Provisioning ---");
  // A) Discord Auth Initiation with ticket
  const discordInitReq = new Request(
    `http://localhost:3000/api/auth/discord?portal=manager&ticket=${encodeURIComponent(preauthTicket)}`
  );
  const discordInitRes = await discordAuthGET(discordInitReq);
  assert.strictEqual(discordInitRes.status, 307, "Discord initiation must redirect");
  const redirectLocation = discordInitRes.headers.get("location");
  assert(redirectLocation, "Must have redirect location");

  // Extract callback params from redirect (mock dev environment)
  const redirectUrl = new URL(redirectLocation, "http://localhost:3000");
  const mockCode = redirectUrl.searchParams.get("code");
  const stateParam = redirectUrl.searchParams.get("state");
  assert(mockCode, "Mock code must be generated");
  assert(stateParam, "State param must be present");

  // B) Discord Callback
  const callbackReq = new Request(
    `http://localhost:3000/api/auth/discord/callback?code=${mockCode}&state=${encodeURIComponent(stateParam)}`,
    {
      headers: {
        cookie: `${PREAUTH_COOKIE_NAME}=${preauthTicket}`,
      },
    }
  );
  const callbackRes = await discordCallbackGET(callbackReq);
  assert.strictEqual(callbackRes.status, 307, "Callback must redirect to dashboard");
  const dashboardRedirect = callbackRes.headers.get("location");
  assert(
    dashboardRedirect && dashboardRedirect.endsWith("/manager/dashboard"),
    `Must redirect to /manager/dashboard (got ${dashboardRedirect})`
  );

  // Extract session cookie
  const setCookie = callbackRes.headers.get("set-cookie");
  assert(setCookie && setCookie.includes("clipearn_session="), "clipearn_session cookie must be set");
  const match = setCookie.match(/clipearn_session=([^;]+)/);
  const managerSessionToken = match![1];
  const managerCookie = `${COOKIE_NAME}=${managerSessionToken}`;

  // Verify in Neon DB that code is now USED and user is MANAGER
  const usedDbRecord = await prisma.managerAccessKey.findUnique({
    where: { id: dbRecord.id },
    include: { used_by_user: true },
  });
  assert.strictEqual(usedDbRecord?.status, "USED", "ManagerAccessKey status in DB must now be USED");
  assert(usedDbRecord?.used_by, "used_by must record the manager user ID");
  assert(usedDbRecord?.used_at, "used_at must record redemption timestamp");
  assert.strictEqual(usedDbRecord?.used_by_user?.role, UserRole.MANAGER, "Created user role must be MANAGER");
  testPass("Manager completed registration: role = MANAGER, code marked USED in database");

  // ------------------------------------------------------------------
  // TEST 4: Used code rejection
  // ------------------------------------------------------------------
  console.log("\n--- TEST 4: Used Code Rejection ---");
  const reuseReq = new Request("http://localhost:3000/api/auth/manager-access-key/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: plainCode, accessKey: plainCode }),
  });
  const reuseRes = await validateKeyPOST(reuseReq);
  const reuseData = await reuseRes.json();
  assert.strictEqual(reuseRes.status, 400, "Used code must return HTTP 400");
  assert.strictEqual(reuseData.valid, false);
  assert.strictEqual(
    reuseData.error,
    "This manager access code has already been used",
    `Error must be 'This manager access code has already been used' (got '${reuseData.error}')`
  );
  testPass("Reused code rejected with exact message: 'This manager access code has already been used'");

  // ------------------------------------------------------------------
  // TEST 5: Session persistence & Manager Dashboard access (NOT Admin)
  // ------------------------------------------------------------------
  (globalThis as any).__mockCookieStore = { [COOKIE_NAME]: managerSessionToken };
  const meRes = await meGET();
  assert.strictEqual(meRes.status, 200, "/api/auth/me must return HTTP 200");
  const meData = await meRes.json();
  assert.strictEqual(meData.user.role, UserRole.MANAGER, "/api/auth/me user role must be MANAGER");
  assert.notStrictEqual(meData.user.role, UserRole.ADMIN, "/api/auth/me user role must NOT be ADMIN");

  const { verifySessionToken } = await import("../src/lib/auth");
  const payload = verifySessionToken(managerSessionToken);
  assert(payload, "Manager session token must be valid");
  assert.strictEqual(payload?.role, UserRole.MANAGER, "Session role must be MANAGER");
  assert.notStrictEqual(payload?.role, UserRole.ADMIN, "Session role must NOT be ADMIN");

  const managerUser = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  assert.strictEqual(managerUser?.role, UserRole.MANAGER, "Database user role is strictly MANAGER");
  assert.notStrictEqual(managerUser?.role, UserRole.ADMIN, "Manager must NOT have ADMIN role");
  testPass("Manager session verified: role is strictly MANAGER across multiple queries (never ADMIN)");

  // ------------------------------------------------------------------
  // TEST 6: Returning Manager Direct Login (No new code needed)
  // ------------------------------------------------------------------
  console.log("\n--- TEST 6: Returning Manager Direct Login (No code needed) ---");
  // Manager logs in directly with Discord (without any invitation key)
  const returnDiscordInitReq = new Request("http://localhost:3000/api/auth/discord?portal=manager");
  const returnDiscordInitRes = await discordAuthGET(returnDiscordInitReq);
  const returnLocation = returnDiscordInitRes.headers.get("location");
  assert(returnLocation, "Returning manager redirect must exist");

  const returnUrl = new URL(returnLocation, "http://localhost:3000");
  const returnState = returnUrl.searchParams.get("state");
  assert(returnState, "State must be generated");

  // Callback for existing manager using their discord_id
  const returnCallbackReq = new Request(
    `http://localhost:3000/api/auth/discord/callback?code=${mockCode}&state=${encodeURIComponent(returnState)}`
  );
  const returnCallbackRes = await discordCallbackGET(returnCallbackReq);
  assert.strictEqual(returnCallbackRes.status, 307, "Returning manager callback must redirect");
  const returnDashboardRedirect = returnCallbackRes.headers.get("location");
  assert(
    returnDashboardRedirect && returnDashboardRedirect.endsWith("/manager/dashboard"),
    `Returning manager must be redirected to /manager/dashboard (got ${returnDashboardRedirect})`
  );
  testPass("Returning Manager logged in directly with Discord without needing a new invitation code");

  // Clean up test data created during test
  await prisma.managerAccessKey.delete({ where: { id: dbRecord.id } });
  await prisma.user.delete({ where: { id: managerUser!.id } });
  testPass("Test database records cleaned up safely without affecting production data");

  console.log("\n=======================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
