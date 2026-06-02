import { registry } from "@/lib/registry";
import { getToolDisplayLabel } from "@/lib/tool-labels";

export type FooterLink = {
  href: string;
  label: string;
  slug?: string;
  external?: boolean;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

function toolLink(slug: string): FooterLink {
  const tool = registry.tools.find((t) => t.slug === slug);
  return {
    href: `/tools/${slug}/`,
    label: getToolDisplayLabel(slug, tool?.title ?? slug),
    slug,
  };
}

function studioLink(slug: string, href: string, label: string): FooterLink {
  return { href, label: getToolDisplayLabel(slug, label), slug };
}

/** Tool columns for the site footer — grouped for SEO and discoverability. */
export const FOOTER_TOOL_COLUMNS: FooterColumn[] = [
  {
    title: "Convert to PDF",
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
    title: "Convert from PDF",
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
    title: "Edit & Optimize",
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
      studioLink("timeline-gantt-generator", "/tools/timeline-gantt-generator/", "Timeline & Gantt"),
      studioLink("data-converter-visualizer", "/tools/data-converter-visualizer/", "Data Converter"),
    ],
  },
  {
    title: "Security & Legal",
    links: [
      toolLink("protect-pdf"),
      toolLink("unlock-pdf"),
      toolLink("pdf-password-recovery"),
      toolLink("safe-to-share-auditor"),
      toolLink("redact-pdf"),
      toolLink("flatten-pdf"),
      toolLink("remove-hidden-metadata"),
      toolLink("sign-pdf"),
      studioLink("invoice-generator", "/tools/invoice-generator/", "Invoice Generator"),
    ],
  },
];

export const FOOTER_COMPANY_COLUMN: FooterColumn = {
  title: "Company & Resources",
  links: [
    { href: "/", label: "Home" },
    { href: "/blog/", label: "Guides & Blog" },
    { href: "/tools/", label: "All PDF tools" },
    { href: "/compare/", label: "Compare tools" },
    { href: "/privacy/", label: "Privacy Policy" },
    { href: "/privacy-first-pdf-tools/", label: "Privacy-first PDF hub" },
  ],
};

export const FOOTER_PARTNER_LINKS: FooterLink[] = [
  {
    href: "https://mapdiagram.com/",
    label: "MapDiagram — flowcharts & diagrams",
    external: true,
  },
  {
    href: "https://wattquick.com/",
    label: "WattQuick — loan & finance calculators",
    external: true,
  },
];

export const FOOTER_BRAND = {
  name: "JoinMyPDF",
  description:
    "Merge, compress, convert, and secure PDFs in your browser. Files stay on your device—no uploads to our servers.",
} as const;

export const FOOTER_TAGLINES = {
  default: FOOTER_BRAND.description,
  tools: "JoinMyPDF — browser-based PDF tools with local processing.",
  blog: "JoinMyPDF — guides for PDF workflows, email limits, and mobile tips.",
} as const;

/** @deprecated Use FOOTER_TOOL_COLUMNS + FOOTER_COMPANY_COLUMN */
export const FOOTER_DIRECTORY_COLUMNS: FooterColumn[] = [
  ...FOOTER_TOOL_COLUMNS,
  FOOTER_COMPANY_COLUMN,
  {
    title: "Partners",
    links: FOOTER_PARTNER_LINKS,
  },
];
