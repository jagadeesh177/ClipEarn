import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runApiTests() {
  console.log("\n=========================================");
  console.log("    CLIPEARN END-TO-END API TESTS        ");
  console.log("=========================================\n");

  // 1. Public Campaigns List
  const campRes = await fetch(`${BASE_URL}/api/campaigns`);
  const campData = await campRes.json();
  assert(campRes.ok, "Public campaigns endpoint must return 200");
  assert(campData.data.length >= 3, "Must have at least 3 active campaigns");
  console.log(`  ✔ PASS: Public campaigns list loaded (${campData.data.length} campaigns)`);

  const steveWynn = campData.data.find((c) => c.name.includes("Steve Wynn"));
  assert(steveWynn, "Steve Wynn campaign must be present");
  console.log(`  ✔ PASS: Steve Wynn #2 verified (CPM: $${steveWynn.cpm}, Budget: $${steveWynn.total_budget})`);

  // 2. Clipper Demo Login
  const clipLoginRes = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "CLIPPER" }),
  });
  const clipLoginData = await clipLoginRes.json();
  assert(clipLoginRes.ok, "Clipper demo login must succeed");
  const clipperCookie = clipLoginRes.headers.get("set-cookie");
  assert(clipperCookie, "Session cookie must be returned");
  console.log(`  ✔ PASS: Demo Clipper login succeeded (User: ${clipLoginData.user.username})`);

  // 3. Authenticated /api/auth/me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: clipperCookie },
  });
  const meData = await meRes.json();
  assert(meRes.ok, "Authenticated /me must succeed");
  assert.strictEqual(meData.user.role, "CLIPPER");
  console.log(`  ✔ PASS: Authenticated session confirmed for @${meData.user.username}`);

  // 4. Clipper Social Accounts
  const socRes = await fetch(`${BASE_URL}/api/social-accounts`, {
    headers: { Cookie: clipperCookie },
  });
  const socData = await socRes.json();
  assert(socRes.ok, "Social accounts endpoint must succeed");
  assert(socData.data.length >= 2, "Clipper must have connected social channels");
  console.log(`  ✔ PASS: Connected channels verified (${socData.data.map((a) => a.platform).join(", ")})`);

  // 5. Clipper Submissions & Ledger
  const subRes = await fetch(`${BASE_URL}/api/submissions`, {
    headers: { Cookie: clipperCookie },
  });
  const subData = await subRes.json();
  assert(subRes.ok, "Submissions endpoint must succeed");
  console.log(`  ✔ PASS: Submissions retrieved (${subData.data.length} clips in ledger)`);

  // 6. Clipper Earnings Summary
  const earnRes = await fetch(`${BASE_URL}/api/payouts`, {
    headers: { Cookie: clipperCookie },
  });
  const earnData = await earnRes.json();
  assert(earnRes.ok, "Earnings summary must succeed");
  console.log(`  ✔ PASS: Financial summary verified (Gross: $${earnData.summary.grossEarnings.toFixed(2)}, Available: $${earnData.summary.availableBalance.toFixed(2)})`);

  // 7. Manager Demo Login
  const mgrLoginRes = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "MANAGER" }),
  });
  const mgrLoginData = await mgrLoginRes.json();
  assert(mgrLoginRes.ok, "Manager demo login must succeed");
  const managerCookie = mgrLoginRes.headers.get("set-cookie");
  assert(managerCookie, "Manager session cookie returned");
  console.log(`  ✔ PASS: Manager session established (User: ${mgrLoginData.user.username})`);

  // 8. Manager Analytics Hub
  const analyticsRes = await fetch(`${BASE_URL}/api/manager/analytics`, {
    headers: { Cookie: managerCookie },
  });
  const analyticsData = await analyticsRes.json();
  assert(analyticsRes.ok, "Manager analytics endpoint must succeed");
  console.log(`  ✔ PASS: Platform analytics verified (Active campaigns: ${analyticsData.data.activeCampaignsCount}, Total clippers: ${analyticsData.data.totalClippersCount})`);

  // 9. Manager Submissions Review Queue
  const mgrSubRes = await fetch(`${BASE_URL}/api/manager/submissions`, {
    headers: { Cookie: managerCookie },
  });
  const mgrSubData = await mgrSubRes.json();
  assert(mgrSubRes.ok, "Manager review queue must succeed");
  console.log(`  ✔ PASS: Review queue retrieved (${mgrSubData.data.length} submissions in registry)`);

  // 10. CSV Export
  const csvRes = await fetch(`${BASE_URL}/api/export/campaign/${steveWynn.id}`, {
    headers: { Cookie: managerCookie },
  });
  assert(csvRes.ok, "CSV export must succeed with 200");
  const csvText = await csvRes.text();
  assert(csvText.includes("Submission ID"), "CSV headers must include Submission ID");
  assert(csvText.includes("Eligible Views"), "CSV headers must include Eligible Views");
  console.log(`  ✔ PASS: Brand CSV export validated (${csvText.split("\n").length} rows returned)`);

  console.log("\n=========================================");
  console.log("  ALL 10 API & WORKFLOW SUITES PASSED!   ");
  console.log("=========================================\n");
}

runApiTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
