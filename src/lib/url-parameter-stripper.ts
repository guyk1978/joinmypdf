/**
 * Local URL Parameter Stripper & Decoder.
 * Client-side only; no uploads.
 */

/** Tracking / referral query keys removed by default. */
export const DEFAULT_TRACKING_PARAMS = [
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "dclid",
  "msclkid",
  "twclid",
  "li_fat_id",
  "mc_eid",
  "igshid",
  "sid",
  "ref",
  "referrer",
  "yclid",
  "zanpid",
  "_hsenc",
  "_hsmi",
  "hsCtaTracking",
  "mkt_tok",
  "spm",
  "scm",
  "si",
] as const;

export type StripUrlOptions = {
  /** Apply decodeURIComponent so %20 and friends become readable. */
  decodeUrl: boolean;
};

export type StripUrlResult =
  | { ok: true; url: string; removedKeys: string[]; hadChanges: boolean }
  | { ok: false; code: "empty" | "invalid" };

function isTrackingKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (lower.startsWith("utm_")) return true;
  if (lower.startsWith("pk_")) return true;
  if (lower.startsWith("mtm_")) return true;
  if (lower.startsWith("hsa_")) return true;
  return (DEFAULT_TRACKING_PARAMS as readonly string[]).includes(lower);
}

export function tryDecodeComponent(value: string): string {
  try {
    let current = value;
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(current.replace(/\+/g, " "));
      if (next === current) break;
      current = next;
    }
    return current;
  } catch {
    return value;
  }
}

function serializeSearch(params: URLSearchParams, decode: boolean): string {
  if (!decode) return params.toString();

  const readable: string[] = [];
  for (const [key, value] of params.entries()) {
    readable.push(`${tryDecodeComponent(key)}=${tryDecodeComponent(value)}`);
  }
  return readable.join("&");
}

function buildUrlString(parsed: URL, kept: URLSearchParams, decode: boolean): string {
  const origin = `${parsed.protocol}//${parsed.host}`;
  let path = parsed.pathname || "/";
  let hash = parsed.hash || "";

  if (decode) {
    path = tryDecodeComponent(path);
    if (hash.startsWith("#")) {
      hash = `#${tryDecodeComponent(hash.slice(1))}`;
    }
  }

  const query = serializeSearch(kept, decode);
  return `${origin}${path}${query ? `?${query}` : ""}${hash}`;
}

/**
 * Strip tracking parameters from a URL and optionally decode encoded characters.
 */
export function stripUrlParameters(input: string, options: StripUrlOptions): StripUrlResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, code: "empty" };

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, code: "invalid" };
  }

  const originalHref = parsed.href;
  const removedKeys: string[] = [];
  const kept = new URLSearchParams();

  for (const [key, value] of parsed.searchParams.entries()) {
    if (isTrackingKey(key)) {
      if (!removedKeys.includes(key)) removedKeys.push(key);
      continue;
    }
    kept.append(key, value);
  }

  const cleaned = buildUrlString(parsed, kept, options.decodeUrl);

  return {
    ok: true,
    url: cleaned,
    removedKeys,
    hadChanges: cleaned !== originalHref || removedKeys.length > 0 || options.decodeUrl,
  };
}

/** Decode a URL-encoded string (not necessarily a full URL). */
export function decodeUrlString(input: string): string {
  return tryDecodeComponent(input.trim());
}
