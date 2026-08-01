/** Viewport presets + helpers for the Responsive Device Preview tool. */

export type DevicePresetId = "phone" | "tablet" | "desktop";
export type DeviceOrientation = "portrait" | "landscape";
export type PreviewSourceMode = "pdf" | "url" | "html";

export type DevicePreset = {
  id: DevicePresetId;
  /** Logical CSS width in portrait. */
  width: number;
  /** Logical CSS height in portrait. */
  height: number;
};

export const DEVICE_PRESETS: Record<DevicePresetId, DevicePreset> = {
  phone: { id: "phone", width: 390, height: 844 },
  tablet: { id: "tablet", width: 768, height: 1024 },
  desktop: { id: "desktop", width: 1280, height: 800 },
};

export const DEVICE_PRESET_ORDER: DevicePresetId[] = ["phone", "tablet", "desktop"];

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 1.5;
export const ZOOM_STEP = 0.1;

export const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sample page</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      color: #0f172a;
      background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
      line-height: 1.5;
    }
    header {
      padding: 1.25rem 1.5rem;
      background: #0f172a;
      color: #f8fafc;
    }
    header h1 { margin: 0; font-size: clamp(1.25rem, 4vw, 1.75rem); }
    header p { margin: 0.35rem 0 0; opacity: 0.75; font-size: 0.9rem; }
    main { padding: 1.5rem; max-width: 42rem; }
    .card {
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 8px 24px rgb(15 23 42 / 0.06);
    }
    .grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
    .chip {
      padding: 0.75rem;
      border-radius: 10px;
      background: #dbeafe;
      color: #1e3a8a;
      font-weight: 600;
      text-align: center;
      font-size: 0.875rem;
    }
    footer {
      padding: 1rem 1.5rem 2rem;
      font-size: 0.8rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <header>
    <h1>Responsive sample</h1>
    <p>Resize the device frame to see this layout adapt.</p>
  </header>
  <main>
    <div class="card">
      <strong>Fluid type &amp; grids</strong>
      <p>Cards and chips reflow as the viewport width changes across phone, tablet, and desktop presets.</p>
    </div>
    <div class="grid">
      <div class="chip">Phone</div>
      <div class="chip">Tablet</div>
      <div class="chip">Desktop</div>
    </div>
  </main>
  <footer>Local preview — nothing is uploaded.</footer>
</body>
</html>`;

export function resolveViewportSize(
  presetId: DevicePresetId,
  orientation: DeviceOrientation,
): { width: number; height: number } {
  const preset = DEVICE_PRESETS[presetId];
  if (orientation === "landscape") {
    return { width: preset.height, height: preset.width };
  }
  return { width: preset.width, height: preset.height };
}

export function clampZoom(value: number): number {
  const stepped = Math.round(value / ZOOM_STEP) * ZOOM_STEP;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(stepped.toFixed(2))));
}

export function normalizePreviewUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export function formatViewportLabel(width: number, height: number): string {
  return `${width} × ${height}`;
}

export type FrameProbeResult = "allowed" | "blocked" | "unknown";

/** True when a same-origin iframe document looks empty / about:blank. */
export function isEmptyPreviewDocument(doc: Document | null | undefined): boolean {
  if (!doc) return true;
  const href = doc.URL || doc.location?.href || "";
  if (!href || href === "about:blank") return true;
  const body = doc.body;
  if (!body) return true;
  const text = (body.innerText || "").replace(/\s+/g, " ").trim();
  return body.children.length === 0 && text.length < 2;
}

function frameAncestorsAllowEmbed(directiveValue: string, embedderOrigin: string): boolean {
  const tokens = directiveValue.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  if (tokens.includes("'none'")) return false;
  if (tokens.includes("*")) return true;

  return tokens.some((token) => {
    if (token === "'self'") return false;
    if (token === "'none'") return false;
    try {
      if (token.startsWith("http://") || token.startsWith("https://")) {
        return embedderOrigin === new URL(token).origin;
      }
      // Scheme-relative or host-only sources: compare host loosely.
      const normalized = token.replace(/^\*\./, "");
      return embedderOrigin.includes(normalized);
    } catch {
      return false;
    }
  });
}

/**
 * Best-effort client check for framing policy.
 * Many sites omit CORS headers, so this often returns "unknown".
 */
export async function probeUrlFrameEmbedding(url: string): Promise<FrameProbeResult> {
  if (typeof window === "undefined") return "unknown";

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return "blocked";
  }

  const embedderOrigin = window.location.origin;

  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      redirect: "follow",
      credentials: "omit",
      headers: { Accept: "text/html,application/xhtml+xml" },
    });

    const xfo = response.headers.get("x-frame-options");
    if (xfo) {
      const value = xfo.trim().toUpperCase();
      if (value.includes("DENY")) return "blocked";
      if (value.includes("SAMEORIGIN") && target.origin !== embedderOrigin) return "blocked";
    }

    const csp =
      response.headers.get("content-security-policy") ||
      response.headers.get("Content-Security-Policy") ||
      "";
    const ancestorsMatch = /(?:^|;)\s*frame-ancestors\s+([^;]+)/i.exec(csp);
    if (ancestorsMatch) {
      return frameAncestorsAllowEmbed(ancestorsMatch[1], embedderOrigin)
        ? "allowed"
        : "blocked";
    }

    // Reachable response with no restrictive framing headers.
    return "allowed";
  } catch {
    return "unknown";
  }
}

export function inspectIframeDocument(
  iframe: HTMLIFrameElement | null,
): "ok" | "empty" | "opaque" {
  if (!iframe) return "opaque";
  try {
    const doc = iframe.contentDocument;
    if (!doc) return "opaque";
    return isEmptyPreviewDocument(doc) ? "empty" : "ok";
  } catch {
    return "opaque";
  }
}
