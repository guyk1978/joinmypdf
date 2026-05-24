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
      { href: "/tools/pdf-to-jpg/", label: "PDF → JPG" },
    ],
  },
  {
    id: "security",
    label: "Security & privacy",
    items: [
      { href: "/tools/pdf-protect/", label: "Protect PDF", comingSoon: true },
      { href: "/tools/pdf-unlock/", label: "Unlock PDF", comingSoon: true },
      { href: "/tools/pdf-redact/", label: "Redact PDF", comingSoon: true },
    ],
  },
];

export const NAV_LINKS: NavLink[] = [
  { href: "/blog/", label: "Guides" },
  { href: "/privacy/", label: "Privacy" },
];

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
