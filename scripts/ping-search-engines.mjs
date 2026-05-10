const GOOGLE_PING = "https://www.google.com/ping?sitemap=";
const BING_PING = "https://www.bing.com/ping?sitemap=";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pingWithRetry(engineName, pingUrl, maxAttempts) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const response = await fetch(pingUrl, { method: "GET" });
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      console.log("[ping][" + engineName + "] success (attempt " + attempt + ")");
      return true;
    } catch (error) {
      console.log(
        "[ping][" +
          engineName +
          "] failed (attempt " +
          attempt +
          "): " +
          (error && error.message ? error.message : "unknown error")
      );
      if (attempt < maxAttempts) {
        await sleep(500);
      }
    }
  }
  return false;
}

export async function pingSearchEngines(sitemapUrl, options = {}) {
  const maxAttempts = Math.max(1, Number(options.maxAttempts || 2));
  if (!sitemapUrl) {
    console.log("[ping] skipped: missing sitemap URL");
    return { google: false, bing: false };
  }

  const encoded = encodeURIComponent(sitemapUrl);
  const googleOk = await pingWithRetry("google", GOOGLE_PING + encoded, maxAttempts);
  const bingOk = await pingWithRetry("bing", BING_PING + encoded, maxAttempts);

  if (!googleOk || !bingOk) {
    console.log("[ping] completed with partial failures (non-blocking).");
  } else {
    console.log("[ping] all engines notified successfully.");
  }
  return { google: googleOk, bing: bingOk };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const sitemapUrlArg = process.argv[2];
  pingSearchEngines(sitemapUrlArg, { maxAttempts: 2 }).catch((error) => {
    console.log("[ping] unexpected error: " + (error && error.message ? error.message : "unknown"));
    process.exit(0);
  });
}
