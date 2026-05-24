/** Shared primary navigation markup for static HTML pages. */

export const NAV_DROPDOWNS = [
  {
    id: "edit",
    label: "Edit & organize",
    items: [
      { href: "/tools/pdf-merge/", label: "Merge PDF" },
      { href: "/tools/pdf-split/", label: "Split PDF" },
      { href: "/tools/delete-pdf-pages/", label: "Delete PDF Pages" },
    ],
  },
  {
    id: "optimize",
    label: "Optimization",
    items: [
      { href: "/tools/pdf-compress/", label: "Compress PDF" },
      { href: "/compare/", label: "Compare tools" },
    ],
  },
  {
    id: "convert",
    label: "Convert PDF",
    items: [
      { href: "/tools/jpg-to-pdf/", label: "JPG → PDF" },
      { href: "/tools/png-to-pdf/", label: "PNG → PDF" },
      { href: "/tools/pdf-to-jpg/", label: "PDF → JPG" },
      { href: "/tools/pdf-to-png/", label: "PDF → PNG" },
    ],
  },
  {
    id: "security",
    label: "Security & privacy",
    items: [
      { href: "/tools/protect-pdf/", label: "Protect PDF" },
      { href: "/tools/unlock-pdf/", label: "Unlock PDF" },
      { href: "/tools/redact-pdf/", label: "Redact PDF" },
    ],
  },
];

export const NAV_LINKS = [
  { href: "/blog/", label: "Guides" },
  { href: "/privacy/", label: "Privacy" },
];

const CHEVRON =
  '<svg class="nav-dropdown__chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function renderDropdown(dropdown) {
  const items = dropdown.items
    .map((item) => {
      if (item.comingSoon) {
        return `<span class="nav-dropdown__item nav-dropdown__item--soon" role="menuitem" aria-disabled="true"><span>${item.label}</span><span class="nav-dropdown__badge">Coming soon</span></span>`;
      }
      return `<a class="nav-dropdown__item" href="${item.href}" role="menuitem">${item.label}</a>`;
    })
    .join("\n            ");

  return `<div class="nav-dropdown" data-nav-dropdown="${dropdown.id}">
          <button type="button" class="nav-dropdown__trigger" aria-expanded="false" aria-haspopup="true">
            ${dropdown.label}
            ${CHEVRON}
          </button>
          <div class="nav-dropdown__panel" role="menu">
            ${items}
          </div>
        </div>`;
}

export function buildSiteNavHtml() {
  const dropdowns = NAV_DROPDOWNS.map(renderDropdown).join("\n        ");
  const links = NAV_LINKS.map(
    (link) => `<a class="nav-link" href="${link.href}">${link.label}</a>`,
  ).join("\n        ");

  return `<button type="button" class="site-header__menu-btn" aria-expanded="false" aria-controls="primary-nav" aria-label="Open menu">
          <span class="site-header__menu-icon" aria-hidden="true"></span>
        </button>
        <nav id="primary-nav" class="main-nav" aria-label="Primary">
        ${dropdowns}
        ${links}
        </nav>`;
}

export const MAIN_NAV_RE = /<nav\b[^>]*class="[^"]*main-nav[^"]*"[^>]*>[\s\S]*?<\/nav>/i;

export function injectSiteNav(html) {
  if (html.includes('data-nav-dropdown="edit"')) {
    return { ok: false, reason: "exists", html };
  }
  if (!MAIN_NAV_RE.test(html)) {
    return { ok: false, reason: "no-nav", html };
  }

  let next = html.replace(MAIN_NAV_RE, buildSiteNavHtml());

  if (!next.includes("/assets/js/site-nav.js")) {
    next = next.replace(
      /<\/body>/i,
      '    <script src="/assets/js/site-nav.js" defer></script>\n  </body>',
    );
  }

  return { ok: true, reason: "patched", html: next };
}
