/** Client-side studio apps (not in PDF tool registry). */
export type StudioToolDef = {
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  ctaLabel: string;
};

export const STUDIO_TOOLS: StudioToolDef[] = [
  {
    slug: "invoice-generator",
    title: "Fast Invoice & Receipt Generator",
    subtitle:
      "Build professional invoices with live A4 preview, line items, and tax—export a client-side PDF with no uploads.",
    href: "/tools/invoice-generator/",
    ctaLabel: "Open invoice builder",
  },
  {
    slug: "timeline-gantt-generator",
    title: "Timeline & Gantt Chart Generator",
    subtitle:
      "Create visual project schedules, milestones, and interactive Gantt charts 100% client-side. Export directly to A4 Landscape PDF.",
    href: "/tools/timeline-gantt-generator/",
    ctaLabel: "Open timeline builder",
  },
  {
    slug: "data-converter-visualizer",
    title: "Universal Data Converter & Visualizer",
    subtitle:
      "Clean, convert, and format CSV or JSON data instantly 100% client-side. Secure file processing with zero server uploads.",
    href: "/tools/data-converter-visualizer/",
    badge: "New",
    ctaLabel: "Open data converter",
  },
];
