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
      { href: "/tools/sign-pdf/", label: "Sign PDF" },
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
