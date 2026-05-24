/** Inline header mini-icon HTML for static pages (styles in assets/css/styles.css). */
export const HEADER_PDF_MINI_HTML = `<span class="header-pdf-mini" title="JoinMyPDF Factory" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect class="header-pdf-mini__back" x="2" y="4" width="9" height="11" rx="1" stroke="#60a5fa" stroke-width="1.2" fill="rgba(96, 165, 250, 0.1)" />
              <rect class="header-pdf-mini__front" x="5" y="1" width="9" height="11" rx="1" stroke="#3b82f6" stroke-width="1.2" fill="rgba(59, 130, 246, 0.2)" />
            </svg>
          </span>`;

export const BRAND_ICON_AFTER_SVG_RE =
  /(<\/svg>\s*)(<img\s+class="brand__icon"[^>]*\/?>)/i;

export function injectHeaderPdfMini(html) {
  if (html.includes('class="header-pdf-mini"')) {
    return { ok: false, reason: "exists", html };
  }
  if (!BRAND_ICON_AFTER_SVG_RE.test(html)) {
    return { ok: false, reason: "no-brand", html };
  }
  const next = html.replace(
    BRAND_ICON_AFTER_SVG_RE,
    `$1${HEADER_PDF_MINI_HTML}\n          $2`,
  );
  return { ok: true, reason: "patched", html: next };
}
