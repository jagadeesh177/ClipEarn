/**
 * Utility functions for robust social account handle and author matching.
 * Handles cosmetic variations such as:
 * - Case insensitivity (@USALegacy vs @usa.legacyy)
 * - Leading @ symbols
 * - Internal punctuation (dots, underscores, dashes: usa.legacy vs usalegacy)
 * - Trailing repeated characters common in usernames when original handle was taken (usalegacy vs usalegacyy)
 * - Brand / display name vs handle prefix matching
 * - Levenshtein edit distance for minor typos
 */

export function cleanAlphanumeric(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * `loose` enables substring / brand matching. It is only safe for display names
 * (e.g. channel title "USA Legacy Clips" vs handle "usalegacy"); for handle-vs-handle
 * comparisons it would let @music claim videos from @musicvideos_official.
 */
function checkSingleMatch(author: string, verifiedHandle: string, loose = false): boolean {
  const rawA = author.toLowerCase().replace(/^@/, "").trim();
  const rawB = verifiedHandle.toLowerCase().replace(/^@/, "").trim();

  if (!rawA || !rawB) return false;

  // 1. Direct match
  if (rawA === rawB) return true;

  // 2. Alphanumeric match (ignoring dots, underscores, dashes, spaces, etc.)
  const cleanA = cleanAlphanumeric(rawA);
  const cleanB = cleanAlphanumeric(rawB);

  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;

  // 3. Repeated character / suffix match (e.g. legacy vs legacyy, clipper vs clipperr)
  const [shorter, longer] =
    cleanA.length <= cleanB.length ? [cleanA, cleanB] : [cleanB, cleanA];

  if (longer.startsWith(shorter)) {
    const diff = longer.slice(shorter.length);
    const lastChar = shorter[shorter.length - 1];
    // Repeated letters of ending character (e.g. 'y' -> 'yy')
    if (diff.split("").every((c) => c === lastChar)) {
      return true;
    }
  }

  if (!loose) return false;

  // 4. Substring / Brand name match (display name contains handle or vice versa)
  if (shorter.length >= 5 && longer.includes(shorter)) {
    return true;
  }

  // 5. Levenshtein edit distance for minor display-name variations
  const maxLen = Math.max(cleanA.length, cleanB.length);
  const dist = levenshteinDistance(cleanA, cleanB);

  if (maxLen >= 8 && dist <= 2) return true;
  if (maxLen >= 5 && dist <= 1) return true;

  return false;
}

/**
 * Checks whether an author extracted from a clip URL/metadata matches the verified account handle.
 * Returns true if they are deemed to be the same identity or compatible handle variation.
 */
export function isAuthorMatch(
  scrapedOrUrlAuthor?: string | null,
  verifiedHandle?: string | null,
  displayName?: string | null
): boolean {
  if (!verifiedHandle) return true;
  if (!scrapedOrUrlAuthor && !displayName) return true;

  if (scrapedOrUrlAuthor && checkSingleMatch(scrapedOrUrlAuthor, verifiedHandle)) {
    return true;
  }

  if (displayName && checkSingleMatch(displayName, verifiedHandle, true)) {
    return true;
  }

  return false;
}

