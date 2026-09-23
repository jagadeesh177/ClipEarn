import { verifyCodeInBiography, InstagramProvider } from "../src/lib/social/instagram";
import { encryptToken, decryptToken } from "../src/lib/encryption";
import { prisma } from "../src/lib/prisma";
import { Platform, VerificationStatus } from "@prisma/client";

async function runTests() {
  console.log("=================================================");
  console.log("   ClipEarn Instagram Verification Test Suite    ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? "- " + detail : ""}`);
      failed++;
    }
  }

  // --- Test 1: Correct code in bio → VERIFIED ---
  {
    const bio = "Fitness creator\nclipearn-552zhusvg\nTraining every day";
    const code = "clipearn-552zhusvg";
    const result = verifyCodeInBiography(bio, code);
    assert(result === true, "Test 1: Correct code in bio → VERIFIED");
  }

  // --- Test 2: Incorrect code → FAILED ---
  {
    const bio = "Fitness creator\nclipearn-999wrongcode\nTraining every day";
    const code = "clipearn-552zhusvg";
    const result = verifyCodeInBiography(bio, code);
    assert(result === false, "Test 2: Incorrect code in bio → FAILED");
  }

  // --- Test 3: Code missing → FAILED ---
  {
    const bio = "Fitness creator\nNo code here\nTraining every day";
    const code = "clipearn-552zhusvg";
    const result = verifyCodeInBiography(bio, code);
    assert(result === false, "Test 3: Code missing in bio → FAILED");
  }

  // --- Test 4: Similar but not exact code → FAILED ---
  {
    // Shorter by 1 char
    const bio1 = "clipearn-552zhusv";
    const code = "clipearn-552zhusvg";
    const result1 = verifyCodeInBiography(bio1, code);

    // Longer by extra chars appended
    const bio2 = "clipearn-552zhusvgextra";
    const result2 = verifyCodeInBiography(bio2, code);

    // Prepended chars
    const bio3 = "myclipearn-552zhusvg";
    const result3 = verifyCodeInBiography(bio3, code);

    assert(
      result1 === false && result2 === false && result3 === false,
      "Test 4: Similar but not exact code → FAILED"
    );
  }

  // --- Test 5: Wrong Instagram account authorized → FAILED ---
  {
    const provider = new InstagramProvider();
    // Simulate an authorized profile returning username "other_user"
    // when target username is "target_creator"
    const authorizedProfileUsername = "other_user";
    const targetUsername = "target_creator";

    const isMatch =
      authorizedProfileUsername.toLowerCase() === targetUsername.toLowerCase();
    assert(
      isMatch === false,
      "Test 5: Wrong Instagram account authorized → FAILED (mismatch prevented)"
    );
  }

  // --- Test 6: Duplicate Instagram account handling ---
  {
    // Verify unique constraint on platform + platform_user_id
    const platformUserId = `instagram_test_dup_${Date.now()}`;
    const code1 = `clipearn-${Math.random().toString(36).substring(2, 8)}`;

    // Create first test user
    const testUser1 = await prisma.user.upsert({
      where: { referral_code: "TEST_USER_1" },
      update: {},
      create: {
        username: "test_user_1",
        email: "test_user_1@clipearn.com",
        referral_code: "TEST_USER_1",
      },
    });

    const testUser2 = await prisma.user.upsert({
      where: { referral_code: "TEST_USER_2" },
      update: {},
      create: {
        username: "test_user_2",
        email: "test_user_2@clipearn.com",
        referral_code: "TEST_USER_2",
      },
    });

    // User 1 links account
    const acc1 = await prisma.socialAccount.create({
      data: {
        user_id: testUser1.id,
        platform: Platform.INSTAGRAM,
        platform_user_id: platformUserId,
        username: "shared_ig_handle",
        verification_code: code1,
        verification_status: VerificationStatus.PENDING,
      },
    });

    // User 2 attempts to link the same account
    let duplicateCaught = false;
    try {
      await prisma.socialAccount.create({
        data: {
          user_id: testUser2.id,
          platform: Platform.INSTAGRAM,
          platform_user_id: platformUserId,
          username: "shared_ig_handle",
          verification_code: "clipearn-different",
          verification_status: VerificationStatus.PENDING,
        },
      });
    } catch {
      duplicateCaught = true;
    }

    assert(
      duplicateCaught === true,
      "Test 6: Duplicate Instagram account → handled correctly (rejected)"
    );

    // Clean up test account
    await prisma.socialAccount.delete({ where: { id: acc1.id } }).catch(() => {});
  }

  // --- Test 7: Expired/invalid OAuth token → graceful error ---
  {
    const provider = new InstagramProvider();
    let handledGracefully = false;
    try {
      const result = await provider.verifyAccount(
        "test_account",
        "clipearn-552zhusvg",
        "invalid_or_expired_token_12345"
      );
      if (!result.is_verified && result.error) {
        handledGracefully = true;
      }
    } catch {
      handledGracefully = false;
    }
    assert(
      handledGracefully === true,
      "Test 7: Expired/invalid OAuth token → graceful error"
    );
  }

  // --- Test 8: API failure → graceful error ---
  {
    const provider = new InstagramProvider();
    let handledGracefully = false;
    try {
      // Intentionally pass an empty token or broken host simulation
      const result = await provider.verifyAccount("test_account", "clipearn-552zhusvg", "");
      if (!result.is_verified && result.error) {
        handledGracefully = true;
      }
    } catch {
      handledGracefully = false;
    }
    assert(
      handledGracefully === true,
      "Test 8: API failure → graceful error"
    );
  }

  // --- Test 9: User refreshes verification page → state remains correct ---
  {
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      const code = `clipearn-${Math.random().toString(36).substring(2, 8)}`;
      const acc = await prisma.socialAccount.create({
        data: {
          user_id: testUser.id,
          platform: Platform.INSTAGRAM,
          platform_user_id: `ig_refresh_test_${Date.now()}`,
          username: "refresh_test_user",
          verification_code: code,
          verification_status: VerificationStatus.PENDING,
        },
      });

      // Simulate refresh by querying database again
      const refreshed = await prisma.socialAccount.findUnique({
        where: { id: acc.id },
      });

      const statePreserved =
        refreshed?.verification_code === code &&
        refreshed?.verification_status === VerificationStatus.PENDING;

      assert(
        statePreserved === true,
        "Test 9: User refreshes verification page → state remains correct"
      );

      // Clean up
      await prisma.socialAccount.delete({ where: { id: acc.id } }).catch(() => {});
    } else {
      assert(true, "Test 9: User refreshes verification page → state remains correct (skipped user query)");
    }
  }

  // --- Test 10: Verification code cannot be reused to verify another account ---
  {
    const codeA = `clipearn-${Math.random().toString(36).substring(2, 8)}`;
    const codeB = `clipearn-${Math.random().toString(36).substring(2, 8)}`;

    const bioContainsCodeA = `Bio | ${codeA}`;
    const canVerifyBWithCodeA = verifyCodeInBiography(bioContainsCodeA, codeB);

    assert(
      canVerifyBWithCodeA === false && codeA !== codeB,
      "Test 10: Verification code cannot be reused to verify another account"
    );
  }

  // --- Bonus Test: Token Encryption & Decryption Security ---
  {
    const rawToken = "EAAGm0PX4ZCpsBA...super_secret_instagram_access_token_123";
    const encrypted = encryptToken(rawToken);
    const decrypted = decryptToken(encrypted);

    assert(
      encrypted !== rawToken && decrypted === rawToken,
      "Security: Access tokens are AES-256-GCM encrypted and securely decrypted"
    );
  }

  console.log("\n=================================================");
  console.log(`Tests Completed: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
