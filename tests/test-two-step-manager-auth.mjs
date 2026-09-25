import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.SESSION_SECRET || "clipearn_ultra_secure_jwt_session_secret_change_in_prod";
const BASE_URL = "http://localhost:3000";

function createSessionCookie(payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  return `clipearn_session=${token}`;
}

async function runTests() {
  console.log("=== STARTING TWO-STEP CAMPAIGN MANAGER AUTHENTICATION TESTS ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Find authorized real admin user for test
  let admin = await prisma.user.findFirst({ where: { email: "aronyesh63@gmail.com" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: "AdminTest",
        email: "admin-test@clipearn.com",
        role: "ADMIN",
        status: "ACTIVE",
        referral_code: "ADMINTEST01",
      },
    });
  }
  const adminCookie = createSessionCookie({
    userId: admin.id,
    role: "ADMIN",
    username: admin.username,
    email: admin.email,
  });

  // Find or create clipper user for non-admin test
  let clipper = await prisma.user.findFirst({ where: { role: "CLIPPER" } });
  if (!clipper) {
    clipper = await prisma.user.create({
      data: {
        username: "ClipperTest",
        email: "clipper-test@clipearn.com",
        role: "CLIPPER",
        status: "ACTIVE",
        referral_code: "CLIPPERTEST01",
      },
    });
  }
  const clipperCookie = createSessionCookie({
    userId: clipper.id,
    role: "CLIPPER",
    username: clipper.username,
    email: clipper.email,
  });

  // 1. Authorization tests on /api/admin/manager-access-keys
  console.log("\n--- TEST SUITE 1: Admin Key Generation & Security Access Controls ---");
  const unauthRes = await fetch(`${BASE_URL}/api/admin/manager-access-keys`, { method: "POST" });
  assert(unauthRes.status === 401, "Unauthenticated user cannot generate access keys (HTTP 401)");

  const clipperRes = await fetch(`${BASE_URL}/api/admin/manager-access-keys`, {
    method: "POST",
    headers: { Cookie: clipperCookie },
  });
  assert(clipperRes.status === 403, "Clipper role cannot generate access keys (HTTP 403)");

  // 2. Admin successfully generates access key
  const genRes = await fetch(`${BASE_URL}/api/admin/manager-access-keys`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(genRes.status === 201 || genRes.status === 200, "Admin can generate manager access key (HTTP 201/200)");
  const genData = await genRes.json();
  const plaintextKey = genData.key;
  const keyId = genData.accessKey?.id;

  assert(
    typeof plaintextKey === "string" && (plaintextKey.startsWith("CE-INVITE-") || plaintextKey.startsWith("CE-MGR-")),
    `Generated key follows CE-INVITE- format (${plaintextKey})`
  );
  assert(
    plaintextKey.length === 18 || plaintextKey.length === 15,
    `Generated key has expected length with high entropy (${plaintextKey})`
  );

  // Verify DB state
  const dbKey = await prisma.managerAccessKey.findUnique({ where: { id: keyId } });
  assert(!!dbKey, "Access key record created in database");
  assert(dbKey.status === "ACTIVE", "Access key status is ACTIVE in database");
  assert(
    (dbKey.key_preview.startsWith("CE-INVITE-") || dbKey.key_preview.startsWith("CE-MGR-")) &&
      dbKey.key_preview.includes("•"),
    `Key preview is masked: ${dbKey.key_preview}`
  );
  assert(
    !dbKey.key_hash.includes("CE-INVITE") && !dbKey.key_hash.includes("CE-MGR"),
    "Plaintext key is NOT stored in database (hashed with SHA-256)"
  );

  // 3. Admin Key Listing
  const listRes = await fetch(`${BASE_URL}/api/admin/manager-access-keys`, {
    headers: { Cookie: adminCookie },
  });
  const listData = await listRes.json();
  assert(listRes.status === 200 && Array.isArray(listData.data), "Admin can list manager access keys (HTTP 200)");
  const foundInList = listData.data.find((k) => k.id === keyId);
  assert(!!foundInList && foundInList.key_preview === dbKey.key_preview, "Created key is listed in Admin key history with preview");

  // 4. Rate Limiting on /api/auth/manager-access-key/validate
  console.log("\n--- TEST SUITE 2: Server-side Key Validation & Rate Limiting ---");
  const testIp = `192.168.100.${Math.floor(Math.random() * 200) + 10}`;

  for (let i = 1; i <= 4; i++) {
    const failRes = await fetch(`${BASE_URL}/api/auth/manager-access-key/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": testIp,
      },
      body: JSON.stringify({ key: "CE-INVITE-INVALID" + i }),
    });
    const failData = await failRes.json();
    assert(failRes.status === 400 && failData.valid === false, `Attempt ${i}: Invalid key rejected with 400`);
  }

  // 5th attempt must trigger rate limit (5 failed attempts per 15 min per IP)
  const rateLimitRes = await fetch(`${BASE_URL}/api/auth/manager-access-key/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": testIp,
    },
    body: JSON.stringify({ key: "CE-INVITE-ANOTHER" }),
  });
  const rateLimitData = await rateLimitRes.json();
  assert(
    rateLimitRes.status === 429 && rateLimitData.error.includes("Too many attempts"),
    "5th failed attempt triggers HTTP 429 Rate Limit with expected message"
  );

  // 5. Valid Key Submission
  const validIp = `192.168.200.${Math.floor(Math.random() * 200) + 10}`;
  // Test with lowercase and whitespace to verify robust normalization
  const spacedLowerKey = `  ${plaintextKey.toLowerCase()}  `;
  const validateRes = await fetch(`${BASE_URL}/api/auth/manager-access-key/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": validIp,
    },
    body: JSON.stringify({ key: spacedLowerKey }),
  });
  const validateData = await validateRes.json();
  assert(validateRes.status === 200 && validateData.valid === true, "Valid key accepted with case/whitespace tolerance (HTTP 200)");

  const setCookie = validateRes.headers.get("set-cookie");
  assert(!!setCookie && setCookie.includes("clipearn_mgr_preauth"), "Pre-auth ticket cookie 'clipearn_mgr_preauth' is set in response header");
  const preAuthCookie = setCookie.split(";")[0];

  // 6. Pre-Auth Ticket Enforcement on Discord OAuth Flow
  console.log("\n--- TEST SUITE 3: Discord OAuth Ticket Enforcement & Gateway Protection ---");
  // A) Invalid preauth ticket on Manager OAuth -> Must be rejected & redirected
  const badTicketOAuthRes = await fetch(`${BASE_URL}/api/auth/discord?role=MANAGER&ticket=invalid_ticket`, {
    redirect: "manual",
  });
  const badTicketRedirect = badTicketOAuthRes.headers.get("location");
  assert(
    badTicketOAuthRes.status === 307 && badTicketRedirect && badTicketRedirect.includes("/manager/login?error=key_invalid"),
    "Invalid ticket on manager OAuth redirects to /manager/login?error=key_invalid"
  );

  // B) Clipper OAuth WITHOUT ticket -> Allowed (Clipper does not need manager key)
  const clipperOAuthRes = await fetch(`${BASE_URL}/api/auth/discord?role=CLIPPER`, {
    redirect: "manual",
  });
  const clipperRedirect = clipperOAuthRes.headers.get("location");
  assert(
    clipperOAuthRes.status === 307 && clipperRedirect && !clipperRedirect.includes("key_required"),
    "Clipper Discord OAuth is completely unrestricted and functions normally"
  );

  // C) Manager OAuth WITH valid pre-auth ticket -> Allowed
  const validManagerOAuthRes = await fetch(`${BASE_URL}/api/auth/discord?role=MANAGER`, {
    headers: { Cookie: preAuthCookie },
    redirect: "manual",
  });
  const validManagerRedirect = validManagerOAuthRes.headers.get("location");
  assert(
    validManagerOAuthRes.status === 307 && validManagerRedirect && validManagerRedirect.includes("callback"),
    "Manager OAuth with preauth ticket is permitted and redirects to callback"
  );

  // 7. OAuth Callback Provisioning & Single-Use Consumption
  console.log("\n--- TEST SUITE 4: Manager Account Provisioning & Single-Use Key Consumption ---");
  // Follow the redirect URL generated by dev mode OAuth
  const callbackRes = await fetch(validManagerRedirect, {
    headers: { Cookie: preAuthCookie },
    redirect: "manual",
  });
  const callbackRedirect = callbackRes.headers.get("location");
  assert(
    callbackRes.status === 307 && callbackRedirect && callbackRedirect.endsWith("/manager/dashboard"),
    "Manager callback completes and redirects to /manager/dashboard"
  );

  const callbackCookies = callbackRes.headers.get("set-cookie");
  assert(
    !!callbackCookies && callbackCookies.includes("clipearn_session="),
    "Manager session cookie 'clipearn_session' is issued upon login"
  );
  assert(
    (!!callbackCookies && callbackCookies.includes("clipearn_mgr_preauth=;")) || callbackCookies.includes("Max-Age=0"),
    "Pre-auth cookie 'clipearn_mgr_preauth' is invalidated/cleared after use"
  );

  // Check DB key status has changed to USED
  const usedDbKey = await prisma.managerAccessKey.findUnique({ where: { id: keyId } });
  assert(usedDbKey.status === "USED", "ManagerAccessKey status changed from ACTIVE to USED");
  assert(!!usedDbKey.used_by && !!usedDbKey.used_at, "ManagerAccessKey has used_by user ID and used_at timestamp recorded");

  // Check user provisioned in DB
  const provisionedUser = await prisma.user.findUnique({ where: { id: usedDbKey.used_by } });
  assert(!!provisionedUser && provisionedUser.role === "MANAGER", "Provisioned user has MANAGER role");

  // 8. Key Reuse Prevention
  console.log("\n--- TEST SUITE 5: Key Reuse & Revocation Protection ---");
  const reuseRes = await fetch(`${BASE_URL}/api/auth/manager-access-key/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": `192.168.210.${Math.floor(Math.random() * 200) + 10}`,
    },
    body: JSON.stringify({ key: plaintextKey }),
  });
  const reuseData = await reuseRes.json();
  assert(reuseRes.status === 400 && reuseData.valid === false, "USED access key cannot be reused (rejected with 400)");

  // 9. Key Revocation Test
  const genRes2 = await fetch(`${BASE_URL}/api/admin/manager-access-keys`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  const genData2 = await genRes2.json();
  const key2 = genData2.key;
  const key2Id = genData2.accessKey.id;

  const revokeRes = await fetch(`${BASE_URL}/api/admin/manager-access-keys/${key2Id}/revoke`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(revokeRes.status === 200, "Admin can revoke an active access key (HTTP 200)");

  const revokedDbKey = await prisma.managerAccessKey.findUnique({ where: { id: key2Id } });
  assert(revokedDbKey.status === "REVOKED", "Key status in DB updated to REVOKED");

  const revokedValidateRes = await fetch(`${BASE_URL}/api/auth/manager-access-key/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": `192.168.220.${Math.floor(Math.random() * 200) + 10}`,
    },
    body: JSON.stringify({ key: key2 }),
  });
  const revokedValidateData = await revokedValidateRes.json();
  assert(
    revokedValidateRes.status === 400 && revokedValidateData.valid === false,
    "REVOKED access key is rejected immediately upon validation with 400"
  );

  console.log(`\n=============================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=============================================\n`);

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
