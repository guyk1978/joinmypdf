/** Unified header brand markup (text + animated mini icon only). */

export const HEADER_PDF_MINI_SVG = `<span class="header-pdf-mini header-pdf-mini--tight" title="JoinMyPDF" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect class="header-pdf-mini__back" x="2" y="4" width="9" height="11" rx="1" stroke="#60a5fa" stroke-width="1.2" fill="rgba(96, 165, 250, 0.1)" />
              <rect class="header-pdf-mini__front" x="5" y="1" width="9" height="11" rx="1" stroke="#3b82f6" stroke-width="1.2" fill="rgba(59, 130, 246, 0.2)" />
            </svg>
          </span>`;

export function buildBrandHtml(href = "/") {
  return `<a class="brand" href="${href}">
          ${HEADER_PDF_MINI_SVG}
          <span class="brand__text">JoinMyPDF</span>
        </a>`;
}

export const BRAND_BLOCK_RE =
  /<a class="brand" href="[^"]*">[\s\S]*?<\/a>/i;
