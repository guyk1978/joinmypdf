/**
 * Build-time viral OG image helpers: content-type themes, hook selection, SVG layout, Sharp rasterize.
 * No runtime / client rendering.
 */

import crypto from "node:crypto";

/** @typedef {"how-to"|"tool"|"comparison"|"guide"} ContentType */

export const CONTENT_TYPE_THEMES = {
  "how-to": { accent: "#3B82F6", accentDeep: "#1E3A8A", badgeFill: "rgba(59,130,246,0.22)" },
  tool: { accent: "#8B5CF6", accentDeep: "#4C1D95", badgeFill: "rgba(139,92,246,0.22)" },
  comparison: { accent: "#F97316", accentDeep: "#9A3412", badgeFill: "rgba(249,115,22,0.22)" },
  guide: { accent: "#22C55E", accentDeep: "#14532D", badgeFill: "rgba(34,197,94,0.22)" },
};

const VIRAL_HOOKS = {
  "how-to": [
    "Save hours of manual work today",
    "Follow this workflow once and win",
    "Stop redoing the same steps forever",
    "Get it right the first time now",
    "Your fastest PDF fix today online",
    "Simple steps that deliver real results",
    "Cut busywork in half this afternoon",
    "The checklist pros actually use daily",
    "Do this before you hit send again",
    "Fewer clicks and much cleaner output",
  ],
  tool: [
    "This browser tool replaces five apps",
    "You need this workflow starting today",
    "Stop wasting time on PDFs right now",
    "Run it in your browser with no wait",
    "No upload drama and just fast results",
    "Built for speed privacy and daily use",
    "One tab means your job is done fast",
    "Ship files without the upload wait time",
    "Local processing with zero extra fluff",
    "The shortcut power users pick every day",
  ],
  comparison: [
    "See the clear winner in just minutes",
    "Cut through the marketing noise today",
    "Pick the safer path for your next file",
    "Facts over feature lists that confuse you",
    "Side by side with absolutely no spin",
    "What actually matters for PDF workflows",
    "Choose with confidence after one read",
    "The honest tradeoff breakdown you need",
    "Stop guessing and start comparing now",
    "Clear criteria means faster decisions today",
  ],
  guide: [
    "Understand PDFs without the usual jargon",
    "The guide teams quietly share internally",
    "Read this before your next big deadline",
    "Clarity for everyday documents at work",
    "What nobody explains clearly about PDFs",
    "Smarter habits start here with one read",
    "Protect files without slowing your team",
    "The primer that saves hours of rework",
    "Better decisions mean fewer costly mistakes",
    "Your PDF literacy upgrade starts right here",
  ],
};

export function hashSlugToUint(slug) {
  const h = crypto.createHash("sha256").update(slug, "utf8").digest();
  return h.readUInt32BE(0);
}

export function deriveContentType(post) {
  const explicit = String((post.seo && post.seo.contentType) || "").toLowerCase().trim();
  if (["how-to", "tool", "comparison", "guide"].includes(explicit)) return /** @type {ContentType} */ (explicit);
  const blob = `${post.keyword || ""} ${post.title || ""} ${post.cluster || ""} ${post.slug || ""}`.toLowerCase();
  if (/\bvs\b|versus|comparison|compare|alternatives|alternative|across\b/i.test(blob)) return "comparison";
  if (/how-to|how to|step|quickly|easily|without losing|under 1mb|under 1 mb/i.test(blob)) return "how-to";
  if (post.intentType === "transactional" || post.cluster === "high-intent") return "tool";
  if (post.cluster === "problem-based") return "how-to";
  return "guide";
}

export function deriveCategoryLabel(post) {
  if (post.seo && post.seo.category) return String(post.seo.category).trim();
  const c = post.cluster || "article";
  return c
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function ogDisplayTitle(post) {
  let t = String(post.title || post.keyword || post.slug || "JoinMyPDF").trim();
  t = t.replace(/\s*[-|]\s*JoinMyPDF Guide\s*$/i, "").trim();
  return t || "JoinMyPDF";
}

export function clampHookWords(text, minWords = 6, maxWords = 10) {
  const words = String(text || "")
    .replace(/["'`]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length > maxWords) return words.slice(0, maxWords).join(" ");
  if (words.length >= minWords) return words.join(" ");
  if (words.length === 0) return "JoinMyPDF Blog tips tools and guides";
  const pad = "for better PDF results today".split(/\s+/);
  while (words.length < minWords && pad.length) words.push(pad.shift());
  return words.join(" ");
}

export function pickPoolHook(contentType, slug, variantOffset = 0) {
  const type = CONTENT_TYPE_THEMES[contentType] ? contentType : "guide";
  const pool = VIRAL_HOOKS[type] || VIRAL_HOOKS.guide;
  const idx = (hashSlugToUint(slug) + variantOffset) % pool.length;
  return pool[idx];
}

/**
 * @param {object} post
 * @param {ContentType} contentType
 * @param {{ variant?: 'a'|'b', overrides?: Record<string,string>, aiCache?: Record<string,string> }} opts
 */
export function resolveHook(post, contentType, opts = {}) {
  const slug = post.slug || "";
  const variantOffset = opts.variant === "b" ? 1 : 0;
  if (post.seo && post.seo.ogHook) return clampHookWords(post.seo.ogHook, 6, 10);
  if (opts.overrides && opts.overrides[slug]) return clampHookWords(opts.overrides[slug], 6, 10);
  if (opts.aiCache && opts.aiCache[slug]) return clampHookWords(opts.aiCache[slug], 6, 10);
  return pickPoolHook(contentType, slug, variantOffset);
}

export function wrapTitleLines(title, maxLines = 3, maxCharsPerLine = 36) {
  const words = String(title).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["JoinMyPDF"];
  const lines = [];
  let line = "";
  for (const w of words) {
    if (lines.length >= maxLines) break;
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length <= maxCharsPerLine) {
      line = candidate;
    } else {
      if (line) {
        lines.push(line);
        line = "";
        if (lines.length >= maxLines) break;
      }
      line = w.length > maxCharsPerLine ? `${w.slice(0, maxCharsPerLine - 1)}…` : w;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  const joined = lines.join(" ");
  const full = words.join(" ");
  if (full.length > joined.length + 2 && lines.length >= maxLines) {
    const last = lines[lines.length - 1];
    if (!last.endsWith("…")) lines[lines.length - 1] = last.replace(/\s+\S+$/, "") + "…";
  }
  return lines.length ? lines : [String(title).slice(0, maxCharsPerLine)];
}

export function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {{ title: string, hook: string, categoryBadge: string, contentType: ContentType }} p
 */
export function buildOgSvg(p) {
  const theme = CONTENT_TYPE_THEMES[p.contentType] || CONTENT_TYPE_THEMES.guide;
  const titleLines = wrapTitleLines(p.title, 3, 36);
  const hook = escapeXml(p.hook);
  const badge = escapeXml(p.categoryBadge.toUpperCase());
  const lineHeight = 54;
  const titleStartY = 268;
  const titleTspans = titleLines
    .map((line, i) => `<tspan x="600" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const hookY = titleStartY + titleLines.length * lineHeight + 42;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0b1220;stop-opacity:1" />
      <stop offset="48%" style="stop-color:${theme.accentDeep};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="980" cy="120" r="220" fill="${theme.accent}" opacity="0.14" />
  <circle cx="160" cy="520" r="260" fill="${theme.accent}" opacity="0.11" />
  <rect x="420" y="72" width="360" height="44" rx="22" fill="${theme.badgeFill}" stroke="${theme.accent}" stroke-width="1.5" opacity="0.95"/>
  <text x="600" y="102" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="20" fill="#E2E8F0" letter-spacing="0.12em">${badge}</text>
  <text x="600" y="${titleStartY}" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="52" fill="#F8FAFC" font-weight="700">${titleTspans}</text>
  <text x="600" y="${hookY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#CBD5E1">${hook}</text>
  <text x="600" y="588" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#94A3B8" font-weight="600">JoinMyPDF</text>
</svg>`;
}

export async function svgToJpeg1200(svgString) {
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(svgString, "utf8"))
    .resize(1200, 630, { fit: "fill" })
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

/**
 * Optional OpenAI hook (build-time). Returns trimmed hook or null.
 * @param {object} post
 * @param {ContentType} contentType
 * @param {string} categoryLabel
 */
export async function fetchAiHook(post, contentType, categoryLabel) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OG_OPENAI_MODEL || "gpt-4o-mini";
  const user = `Article title: ${post.title || post.keyword}\nSlug: ${post.slug}\nCategory label: ${categoryLabel}\nContent type: ${contentType}\nReturn ONE viral social preview hook, 6 to 10 words, Title Case, no quotes, no hashtags, no brand names.`;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        max_tokens: 40,
        messages: [
          {
            role: "system",
            content:
              "You write ultra-short viral hooks for link previews. Output only the hook phrase, nothing else.",
          },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) return null;
    return clampHookWords(text, 6, 10);
  } catch {
    return null;
  }
}
