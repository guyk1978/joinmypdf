import { blogRegistry } from "./blog-registry";

export type PdfHub = {
  path: string;
  title: string;
  description: string;
  /** Slugs to feature first on hub (tier-1 priority) */
  featuredSlugs: string[];
  /** blog cluster filters for additional listings */
  clusters?: string[];
};

export const pdfHubs: PdfHub[] = [
  {
    path: "/pdf-guides/",
    title: "PDF Guides",
    description:
      "Editorial guides for merge, compress, split, and delivery—written for real workflows, not generic definitions.",
    featuredSlugs: [
      "merge-pdf-online-fast",
      "compress-pdf-free-fast",
      "split-pdf-tool-fast",
    ],
    clusters: ["high-intent", "problem-based"],
  },
  {
    path: "/pdf-comparison/",
    title: "PDF Tool Comparisons",
    description:
      "Honest comparisons of browser-local, upload-based, and desktop PDF software—with pricing, privacy, and tradeoffs.",
    featuredSlugs: [
      "adobe-acrobat-alternatives-for-small-business",
      "adobe-acrobat-alternatives-for-freelancers",
      "browser-pdf-tools-comparison-for-small-business",
      "online-vs-offline-pdf-tools-for-small-business",
      "best-pdf-tools-2026-for-small-business",
    ],
    clusters: ["comparison"],
  },
  {
    path: "/pdf-privacy/",
    title: "PDF Privacy & Security",
    description:
      "Local processing, upload risks, IT checklists, and when browser tools are not enough.",
    featuredSlugs: [
      "client-side-pdf-tools-with-local-processing",
      "safe-pdf-tools-online-without-cloud-upload",
      "is-it-safe-to-upload-pdf-without-cloud-upload",
    ],
    clusters: ["privacy-trust"],
  },
  {
    path: "/pdf-workflows/",
    title: "PDF Workflows",
    description:
      "Step-by-step workflows for Gmail, mobile, and tight attachment limits.",
    featuredSlugs: [
      "how-to-reduce-pdf-size-under-1mb-for-gmail",
      "how-to-merge-pdf-on-mobile-for-gmail",
      "pdf-too-large-fix-for-gmail",
      "how-to-send-pdf-via-email-for-gmail",
    ],
    clusters: ["problem-based"],
  },
];

export function postsForHub(hub: PdfHub) {
  const posts = blogRegistry.blog || [];
  const featured = hub.featuredSlugs
    .map((slug) => posts.find((p) => p.slug === slug))
    .filter(Boolean);
  const featuredSet = new Set(hub.featuredSlugs);
  const more = posts.filter(
    (p) =>
      !featuredSet.has(p.slug) &&
      hub.clusters?.includes(p.cluster || "") &&
      (p.tier1 || (p.contentBlocks?.wordCount || 0) >= 500)
  );
  return { featured, more: more.slice(0, 12) };
}

export function hubByPath(path: string) {
  return pdfHubs.find((h) => h.path === path);
}
