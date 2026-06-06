export type FooterToolLink = {
  kind: "tool";
  slug: string;
  href: string;
};

export type FooterPageLink = {
  kind: "page";
  href: string;
  labelKey: string;
};

export type FooterExternalLink = {
  kind: "external";
  href: string;
  labelKey: string;
};

export type FooterLinkDef = FooterToolLink | FooterPageLink | FooterExternalLink;

export type FooterColumn = {
  titleKey: string;
  links: FooterLinkDef[];
};

function toolLink(slug: string): FooterToolLink {
  return { kind: "tool", slug, href: `/tools/${slug}/` };
}

/** Simplified footer columns — category and product links, not individual tools. */
export const FOOTER_PRODUCT_COLUMN: FooterColumn = {
  titleKey: "product",
  links: [
    { kind: "page", href: "/tools/", labelKey: "features" },
    { kind: "page", href: "/privacy-first/", labelKey: "privacyFirst" },
    { kind: "page", href: "/privacy-first-pdf-tools/", labelKey: "security" },
  ],
};

export const FOOTER_CATEGORIES_COLUMN: FooterColumn = {
  titleKey: "categories",
  links: [
    { kind: "page", href: "/tools/#convert", labelKey: "converters" },
    { kind: "page", href: "/tools/#optimize", labelKey: "optimization" },
    { kind: "page", href: "/tools/#security", labelKey: "securityTools" },
  ],
};

export const FOOTER_COMPANY_COLUMN: FooterColumn = {
  titleKey: "company",
  links: [
    { kind: "page", href: "/compare/", labelKey: "about" },
    { kind: "page", href: "/privacy/", labelKey: "terms" },
    { kind: "page", href: "/privacy/", labelKey: "contact" },
  ],
};

/** @deprecated Footer no longer lists individual tools — kept for tools-directory helpers. */
export const FOOTER_TOOL_COLUMNS: FooterColumn[] = [
  {
    titleKey: "convertToPdf",
    links: [
      toolLink("word-to-pdf"),
      toolLink("excel-to-pdf"),
      toolLink("powerpoint-to-pdf"),
      toolLink("jpg-to-pdf"),
      toolLink("png-to-pdf"),
      toolLink("heic-to-pdf"),
      toolLink("openoffice-to-pdf"),
      toolLink("markdown-to-pdf"),
      toolLink("html-to-pdf"),
      toolLink("ebook-to-pdf"),
      toolLink("iwork-to-pdf"),
      toolLink("autocad-to-pdf"),
    ],
  },
  {
    titleKey: "convertFromPdf",
    links: [
      toolLink("pdf-to-jpg"),
      toolLink("pdf-to-png"),
      toolLink("pdf-to-text"),
      toolLink("extract-images"),
      toolLink("pdf-to-word"),
      toolLink("pdf-to-excel"),
      toolLink("pdf-to-powerpoint"),
    ],
  },
  {
    titleKey: "editOptimize",
    links: [
      toolLink("pdf-merge"),
      toolLink("pdf-split"),
      toolLink("batch-rename-pdf"),
      toolLink("compare-pdf"),
      toolLink("pdf-to-booklet"),
      toolLink("pdf-compress"),
      toolLink("rotate-pdf"),
      toolLink("delete-pdf-pages"),
      toolLink("crop-pdf"),
      toolLink("custom-paper-margin"),
      toolLink("add-page-numbers"),
      toolLink("add-watermark"),
      toolLink("timeline-gantt-generator"),
      toolLink("data-converter-visualizer"),
    ],
  },
  {
    titleKey: "securityLegal",
    links: [
      toolLink("protect-pdf"),
      toolLink("unlock-pdf"),
      toolLink("pdf-password-recovery"),
      toolLink("safe-to-share-auditor"),
      toolLink("redact-pdf"),
      toolLink("flatten-pdf"),
      toolLink("remove-hidden-metadata"),
      toolLink("sign-pdf"),
      toolLink("invoice-generator"),
    ],
  },
];

export const FOOTER_PARTNER_LINKS: FooterExternalLink[] = [
  {
    kind: "external",
    href: "https://mapdiagram.com/",
    labelKey: "mapDiagram",
  },
  {
    kind: "external",
    href: "https://wattquick.com/",
    labelKey: "wattQuick",
  },
];

export const FOOTER_BRAND = {
  name: "JoinMyPDF",
} as const;

export const FOOTER_TAGLINE_KEYS = {
  default: "brandDescription",
  tools: "tools",
  blog: "blog",
} as const;

/** @deprecated Use FOOTER_PRODUCT_COLUMN + FOOTER_CATEGORIES_COLUMN + FOOTER_COMPANY_COLUMN */
export const FOOTER_DIRECTORY_COLUMNS: FooterColumn[] = [
  FOOTER_PRODUCT_COLUMN,
  FOOTER_CATEGORIES_COLUMN,
  FOOTER_COMPANY_COLUMN,
];
