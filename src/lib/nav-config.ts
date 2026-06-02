export type NavItem = {
  href: string;
  label: string;
  comingSoon?: boolean;
};

export type NavDropdown = {
  id: string;
  label: string;
  items: NavItem[];
};

export type NavLink = {
  href: string;
  label: string;
};

export const NAV_DROPDOWNS: NavDropdown[] = [
  {
    id: "edit",
    label: "Edit & organize",
    items: [
      { href: "/tools/pdf-merge/", label: "Merge PDF" },
      { href: "/tools/pdf-split/", label: "Split PDF" },
      { href: "/tools/delete-pdf-pages/", label: "Delete PDF Pages" },
      { href: "/tools/add-page-numbers/", label: "Add Page Numbers" },
      { href: "/tools/crop-pdf/", label: "Crop PDF" },
      { href: "/tools/add-watermark/", label: "Add Watermark" },
      { href: "/tools/rotate-pdf/", label: "Rotate PDF" },
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
      { href: "/tools/heic-to-pdf/", label: "HEIC to PDF" },
      { href: "/tools/pdf-to-jpg/", label: "PDF → JPG" },
      { href: "/tools/pdf-to-png/", label: "PDF → PNG" },
      { href: "/tools/pdf-to-text/", label: "PDF to Text" },
      { href: "/tools/extract-images/", label: "Extract Images" },
      { href: "/tools/pdf-to-word/", label: "PDF to Word" },
      { href: "/tools/word-to-pdf/", label: "Word to PDF" },
      { href: "/tools/excel-to-pdf/", label: "Excel to PDF" },
      { href: "/tools/powerpoint-to-pdf/", label: "PowerPoint to PDF" },
      { href: "/tools/pdf-to-powerpoint/", label: "PDF to PowerPoint" },
      { href: "/tools/pdf-to-excel/", label: "PDF to Excel" },
      { href: "/tools/openoffice-to-pdf/", label: "OpenOffice to PDF" },
      { href: "/tools/markdown-to-pdf/", label: "Markdown to PDF" },
      { href: "/tools/html-to-pdf/", label: "HTML to PDF" },
      { href: "/tools/ebook-to-pdf/", label: "eBook to PDF" },
      { href: "/tools/iwork-to-pdf/", label: "iWork to PDF" },
    ],
  },
  {
    id: "developer",
    label: "Developer Utilities",
    items: [
      { href: "/tools/markdown-to-pdf/", label: "Markdown to PDF" },
      { href: "/tools/html-to-pdf/", label: "HTML to PDF" },
      { href: "/tools/ebook-to-pdf/", label: "eBook to PDF" },
      { href: "/tools/iwork-to-pdf/", label: "iWork to PDF" },
    ],
  },
  {
    id: "cad",
    label: "CAD Utilities",
    items: [{ href: "/tools/autocad-to-pdf/", label: "AutoCAD to PDF" }],
  },
  {
    id: "security",
    label: "Security & privacy",
    items: [
      { href: "/tools/protect-pdf/", label: "Protect PDF" },
      { href: "/tools/unlock-pdf/", label: "Unlock PDF" },
      { href: "/tools/redact-pdf/", label: "Redact PDF" },
      { href: "/tools/flatten-pdf/", label: "Flatten PDF" },
      { href: "/tools/remove-hidden-metadata/", label: "Remove Metadata" },
      { href: "/tools/sign-pdf/", label: "Sign PDF" },
    ],
  },
];

export const NAV_GUIDES_DROPDOWN: NavDropdown = {
  id: "guides",
  label: "Guides",
  items: [{ href: "/blog/", label: "All guides" }],
};

export const NAV_LINKS: NavLink[] = [{ href: "/privacy/", label: "Privacy" }];

export function buildGuidesNavItems(
  posts: { slug: string; title: string; datePublished?: string; date?: string }[]
): NavItem[] {
  const sorted = [...posts].sort((a, b) => {
    const da = a.datePublished || a.date || "";
    const db = b.datePublished || b.date || "";
    return db.localeCompare(da);
  });
  const items: NavItem[] = [{ href: "/blog/", label: "All guides" }];
  for (const post of sorted) {
    if (!post.slug || !post.title) continue;
    items.push({ href: `/blog/${post.slug}/`, label: post.title });
  }
  return items;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (!href || href === "#") return false;
  const normalized = href.endsWith("/") ? href : `${href}/`;
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (normalized === "/") return path === "/";
  return path === normalized || path.startsWith(normalized);
}

export function isDropdownActive(pathname: string, dropdown: NavDropdown): boolean {
  return dropdown.items.some((item) => !item.comingSoon && isNavItemActive(pathname, item.href));
}
