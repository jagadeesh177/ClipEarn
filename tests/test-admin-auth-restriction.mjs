import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== STARTING ADMIN AUTHENTICATION RESTRICTION TESTS ===\n");
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

  // 1. Test Admin Account 1: aronyesh63@gmail.com
  console.log("\n--- TEST SUITE 1: Authorized Real Admin 1 (aronyesh63@gmail.com) ---");
  const admin1Res = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "aronyesh63@gmail.com",
      password: "Aron@2006",
    }),
  });
  const admin1Data = await admin1Res.json();
  assert(admin1Res.status === 200 && admin1Data.success === true, "Admin 1 (aronyesh63@gmail.com) logs in successfully (HTTP 200)");
  assert(admin1Data.user?.role === "ADMIN", "Admin 1 user role is ADMIN");
  const admin1Cookie = admin1Res.headers.get("set-cookie")?.split(";")[0];
  assert(!!admin1Cookie && admin1Cookie.includes("clipearn_session="), "Admin 1 receives session cookie");

  // Test case insensitivity for Admin 1
  const admin1CaseRes = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "  ArOnYeSh63@GMAIL.COM  ",
      password: "Aron@2006",
    }),
  });
  assert(admin1CaseRes.status === 200, "Admin 1 login is tolerant of casing and leading/trailing whitespace");

  // Test wrong password for Admin 1
  const admin1WrongRes = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "aronyesh63@gmail.com",
      password: "WrongPassword123!",
    }),
  });
  const admin1WrongData = await admin1WrongRes.json();
  assert(admin1WrongRes.status === 401 && admin1WrongData.error === "Invalid admin credentials.", "Admin 1 with wrong password rejected with 'Invalid admin credentials.' (HTTP 401)");

  // 2. Test Admin Account 2: easalajagadeesh@gmail.com
  console.log("\n--- TEST SUITE 2: Authorized Real Admin 2 (easalajagadeesh@gmail.com) ---");
  const admin2Res = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "easalajagadeesh@gmail.com",
      password: "Jazz@2006",
    }),
  });
  const admin2Data = await admin2Res.json();
  assert(admin2Res.status === 200 && admin2Data.success === true, "Admin 2 (easalajagadeesh@gmail.com) logs in successfully (HTTP 200)");
  assert(admin2Data.user?.role === "ADMIN", "Admin 2 user role is ADMIN");
  const admin2Cookie = admin2Res.headers.get("set-cookie")?.split(";")[0];
  assert(!!admin2Cookie && admin2Cookie.includes("clipearn_session="), "Admin 2 receives session cookie");

  // Test case insensitivity for Admin 2
  const admin2CaseRes = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "EASALAJAGADEESH@GMAIL.COM",
      password: "Jazz@2006",
    }),
  });
  assert(admin2CaseRes.status === 200, "Admin 2 login is tolerant of casing");

  // Test wrong password for Admin 2
  const admin2WrongRes = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "easalajagadeesh@gmail.com",
      password: "WrongPassword999!",
    }),
  });
  const admin2WrongData = await admin2WrongRes.json();
  assert(admin2WrongRes.status === 401 && admin2WrongData.error === "Invalid admin credentials.", "Admin 2 with wrong password rejected with 'Invalid admin credentials.' (HTTP 401)");

  // 3. Rejection of unauthorized accounts trying to log in as Admin
  console.log("\n--- TEST SUITE 3: Unauthorized Accounts Rejected from Admin Login ---");

  // Old demo admin credentials (admin@clipearn.com / admin123)
  const oldAdminRes = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@clipearn.com",
      password: "admin123",
    }),
  });
  const oldAdminData = await oldAdminRes.json();
  assert(oldAdminRes.status === 401 && oldAdminData.error === "Invalid admin credentials.", "Old admin@clipearn.com cannot log in as real admin (HTTP 401)");

  // Arbitrary email
  const unknownEmailRes = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "attacker@hack.com",
      password: "AnyPassword123!",
    }),
  });
  const unknownEmailData = await unknownEmailRes.json();
  assert(unknownEmailRes.status === 401 && unknownEmailData.error === "Invalid admin credentials.", "Unknown email rejected without enumeration (HTTP 401)");

  // Existing clipper trying to log in as Admin
  const clipperRes = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "clipper@clipearn.com",
      password: "anypassword",
    }),
  });
  assert(clipperRes.status === 401, "Clipper account rejected from Admin/Staff login (HTTP 401)");

  // 4. Admin API Protection & Role Verification
  console.log("\n--- TEST SUITE 4: Server-Side Admin API Protection ---");

  // Admin 1 can access Admin API
  const admin1ApiRes = await fetch(`${BASE_URL}/api/admin/manager-access-keys`, {
    headers: { Cookie: admin1Cookie },
  });
  assert(admin1ApiRes.status === 200, "Admin 1 can access Admin API /api/admin/manager-access-keys (HTTP 200)");

  // Admin 2 can access Admin API
  const admin2ApiRes = await fetch(`${BASE_URL}/api/admin/manager-access-keys`, {
    headers: { Cookie: admin2Cookie },
  });
  assert(admin2ApiRes.status === 200, "Admin 2 can access Admin API /api/admin/manager-access-keys (HTTP 200)");

  // Admin 1 can generate a Manager Access Code
  const genCodeRes = await fetch(`${BASE_URL}/api/admin/manager-access-keys`, {
    method: "POST",
    headers: { Cookie: admin1Cookie },
  });
  assert(genCodeRes.status === 201 || genCodeRes.status === 200, "Admin 1 can generate Manager Access Code (HTTP 201/200)");

  // Unauthenticated user cannot access Admin API
  const unauthApiRes = await fetch(`${BASE_URL}/api/admin/manager-access-keys`);
  assert(unauthApiRes.status === 401 || unauthApiRes.status === 403, "Unauthenticated request to Admin API rejected (HTTP 401/403)");

  // 5. Demo Login Functionality Permanently Removed
  console.log("\n--- TEST SUITE 5: Demo Login Permanently Removed ---");
  const demoRes = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "CLIPPER" }),
  });
  assert(demoRes.status === 404, "Demo Login endpoint permanently removed (HTTP 404)");

  // 6. Demo Manager Login (manager@clipearn.com) Removed Completely
  console.log("\n--- TEST SUITE 6: Demo Manager Login Removed ---");
  const mgrLoginRes = await fetch(`${BASE_URL}/api/auth/manager-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "manager@clipearn.com",
      password: "manager123",
    }),
  });
  const mgrLoginData = await mgrLoginRes.json();
  assert(
    mgrLoginRes.status === 401 && mgrLoginData.error === "Invalid admin credentials.",
    "Demo Manager credentials (manager@clipearn.com / manager123) successfully rejected with HTTP 401"
  );

  console.log(`\n=============================================`);
  console.log(`ADMIN TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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
