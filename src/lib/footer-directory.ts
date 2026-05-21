export type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
  partners?: boolean;
};

export const FOOTER_DIRECTORY_COLUMNS: FooterColumn[] = [
  {
    title: "Privacy & security",
    links: [
      { href: "/privacy/", label: "Privacy policy" },
      { href: "/privacy-first-pdf-tools/", label: "Privacy-first PDF hub" },
    ],
  },
  {
    title: "Comparisons",
    links: [{ href: "/compare/", label: "Tool comparisons" }],
  },
  {
    title: "Guides & tools",
    links: [
      { href: "/blog/", label: "Guides" },
      { href: "/tools/pdf-merge/", label: "Merge PDF" },
      { href: "/tools/pdf-compress/", label: "Compress PDF" },
    ],
  },
  {
    title: "Partner tools",
    partners: true,
    links: [
      {
        href: "https://calnexapp.com/",
        label: "Model Loan Repayments ➔ CalnexApp",
        external: true,
      },
      {
        href: "https://mapdiagram.com/",
        label: "Visualize your ideas → MapDiagram",
        external: true,
      },
    ],
  },
];

export const FOOTER_TAGLINES = {
  default: "JoinMyPDF — browser-based PDF utilities with local processing.",
  tools: "JoinMyPDF — browser-based PDF tools with local processing.",
  blog: "JoinMyPDF Blog Factory",
} as const;
