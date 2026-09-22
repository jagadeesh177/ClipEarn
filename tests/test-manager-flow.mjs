async function test() {
  console.log("1. Testing POST /api/auth/manager-login...");
  const loginRes = await fetch("http://localhost:3000/api/auth/manager-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "manager@clipearn.com", password: "manager123" }),
  });

  console.log("Login Status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("Login Data:", loginData);

  const cookieHeader = loginRes.headers.get("set-cookie");
  console.log("Set-Cookie Header:", cookieHeader);

  if (!cookieHeader) {
    console.error("NO COOKIE RETURNED!");
    return;
  }

  // Extract the cookie name and value
  const cookie = cookieHeader.split(";")[0];
  console.log("Using cookie:", cookie);

  console.log("\n2. Testing GET /api/auth/me with cookie...");
  const meRes = await fetch("http://localhost:3000/api/auth/me", {
    headers: { Cookie: cookie },
  });
  console.log("Me Status:", meRes.status);
  const meData = await meRes.json();
  console.log("Me Data:", meData);

  console.log("\n3. Testing GET /api/manager/analytics with cookie...");
  const analyticsRes = await fetch("http://localhost:3000/api/manager/analytics", {
    headers: { Cookie: cookie },
  });
  console.log("Analytics Status:", analyticsRes.status);
  const analyticsData = await analyticsRes.json();
  console.log("Analytics Data:", analyticsData);
}

test().catch(console.error);
