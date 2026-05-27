import { buildBrandHtml } from "./brand-html.mjs";
import { buildHeaderSearchHtml } from "./site-search-html.mjs";

export const NAV_DROPDOWNS = [
  {
    id: "edit",
    label: "Edit & organize",
    items: [
      { href: "/tools/pdf-merge/", label: "Merge PDF" },
      { href: "/tools/pdf-split/", label: "Split PDF" },
      { href: "/tools/delete-pdf-pages/", label: "Delete PDF Pages" },
      { href: "/tools/add-page-numbers/", label: "Add Page Numbers" },
      { href: "/tools/invoice-generator/", label: "Invoice Generator" },
      { href: "/tools/timeline-gantt-generator/", label: "Timeline & Gantt" },
      { href: "/tools/data-converter-visualizer/", label: "Data Converter" },
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
      { href: "/tools/pdf-to-word/", label: "PDF to Word" },
      { href: "/tools/word-to-pdf/", label: "Word to PDF" },
      { href: "/tools/excel-to-pdf/", label: "Excel to PDF" },
    ],
  },
  {
    id: "security",
    label: "Security & privacy",
    items: [
      { href: "/tools/protect-pdf/", label: "Protect PDF" },
      { href: "/tools/unlock-pdf/", label: "Unlock PDF" },
      { href: "/tools/redact-pdf/", label: "Redact PDF" },
      { href: "/tools/sign-pdf/", label: "Sign PDF" },
    ],
  },
];

const NAV_CHEVRON = `<svg class="nav-dropdown__chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildGuidesNavItems(blogPosts = []) {
  const sorted = [...blogPosts].sort((a, b) => {
    const da = a.datePublished || a.date || "";
    const db = b.datePublished || b.date || "";
    return db.localeCompare(da);
  });
  const items = [{ href: "/blog/", label: "All guides" }];
  for (const post of sorted) {
    if (!post?.slug || !post?.title) continue;
    items.push({ href: `/blog/${post.slug}/`, label: post.title });
  }
  return items;
}

function buildDropdownHtml(dropdown) {
  const items = dropdown.items
    .map(
      (item) =>
        `<a class="nav-dropdown__item" href="${item.href}" role="menuitem">${escapeHtml(item.label)}</a>`
    )
    .join("\n            ");
  return `<div class="nav-dropdown" data-nav-dropdown="${dropdown.id}">
          <button type="button" class="nav-dropdown__trigger" aria-expanded="false" aria-haspopup="true">
            ${escapeHtml(dropdown.label)}
            ${NAV_CHEVRON}
          </button>
          <div class="nav-dropdown__panel" role="menu">
            ${items}
          </div>
        </div>`;
}

function buildGuidesDropdownHtml(blogPosts = []) {
  const items = buildGuidesNavItems(blogPosts);
  const links = items
    .map(
      (item) =>
        `<a class="nav-dropdown__item" href="${item.href}" role="menuitem">${escapeHtml(item.label)}</a>`
    )
    .join("\n            ");
  return `<div class="nav-dropdown nav-dropdown--guides" data-nav-dropdown="guides">
          <button type="button" class="nav-dropdown__trigger" aria-expanded="false" aria-haspopup="true">
            Guides
            ${NAV_CHEVRON}
          </button>
          <div class="nav-dropdown__panel nav-dropdown__panel--guides" id="nav-guides-panel" role="menu" data-nav-guides-hydrate="1">
            ${links}
          </div>
        </div>`;
}

export function buildSiteNavHtml(blogPosts = []) {
  const dropdowns = NAV_DROPDOWNS.map(buildDropdownHtml).join("\n        ");
  const guides = buildGuidesDropdownHtml(blogPosts);
  return `<nav id="primary-nav" class="main-nav" aria-label="Primary">
        ${dropdowns}
        ${guides}
        <a class="nav-link" href="/privacy/">Privacy</a>
        </nav>`;
}

export function buildSiteHeaderInnerHtml(blogPosts = []) {
  return `${buildBrandHtml("/").replace('class="brand"', 'class="brand site-header__brand"')}
        <div class="site-header__cluster">
        ${buildHeaderSearchHtml()}
        <button type="button" class="site-header__menu-btn" aria-expanded="false" aria-controls="primary-nav" aria-label="Open menu">
          <span class="site-header__menu-icon" aria-hidden="true"></span>
        </button>
        ${buildSiteNavHtml(blogPosts)}
        </div>`;
}

export const SITE_HEADER_INNER_RE =
  /<div class="(?:container site-header__inner|site-header__inner container)">[\s\S]*?<\/div>\s*<\/header>/i;

const LEGACY_GUIDES_LINK_RE = /<a class="nav-link" href="\/blog\/">Guides<\/a>\s*/i;

export function injectSiteHeader(html, blogPosts = []) {
  if (!SITE_HEADER_INNER_RE.test(html)) {
    return { ok: false, html };
  }
  const inner = buildSiteHeaderInnerHtml(blogPosts);
  let next = html.replace(
    SITE_HEADER_INNER_RE,
    `<div class="container site-header__inner">\n        ${inner}\n      </div>\n    </header>`
  );
  return { ok: true, html: next };
}

export function injectSiteNav(html, blogPosts = []) {
  return injectSiteHeader(html, blogPosts);
}
