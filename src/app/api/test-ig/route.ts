import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("u") || "jagadeesheasala";
  const code = url.searchParams.get("c") || "clipearn-rmxy2r";

  const bots = [
    { name: "Twitterbot", ua: "Twitterbot/1.0" },
    { name: "TelegramBot", ua: "TelegramBot (like TwitterBot)" },
    { name: "Googlebot", ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
    { name: "Discordbot", ua: "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)" },
    { name: "Slackbot", ua: "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)" },
    { name: "WhatsApp", ua: "WhatsApp/2.21.12.21 A" },
    { name: "facebookexternalhit", ua: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" },
    { name: "Bingbot", ua: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" },
  ];

  const results: any[] = [];

  for (const b of bots) {
    try {
      const res = await fetch(`https://www.instagram.com/${username}/`, {
        headers: {
          "User-Agent": b.ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      });

      const text = await res.text();
      const metaMatch =
        text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
        text.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      const ogMatch =
        text.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
        text.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);

      results.push({
        bot: b.name,
        status: res.status,
        htmlLength: text.length,
        hasCode: text.includes(code),
        isLoginWall: text.includes("Welcome back to Instagram") || (metaMatch && metaMatch[1].includes("Welcome back to Instagram")),
        metaDesc: metaMatch ? metaMatch[1].slice(0, 150) : null,
        ogDesc: ogMatch ? ogMatch[1].slice(0, 150) : null,
      });
    } catch (e: any) {
      results.push({ bot: b.name, error: e.message });
    }
  }

  return NextResponse.json({ username, code, results });
}
