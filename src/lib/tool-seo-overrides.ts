import type { ToolPageTranslator } from "./i18n-tool-page";
import type { ToolDefinition, ToolVariant } from "./types";

const SEO_TOOL_SLUGS = ["pdf-merge", "pdf-split", "pdf-compress", "rotate-pdf", "crop-pdf", "delete-pdf-pages", "reorder-pdf-pages", "extract-pdf-pages", "add-page-numbers", "add-watermark", "annotate-pdf", "compare-pdf", "pdf-to-booklet", "batch-rename-pdf", "pdf-text-editor", "custom-paper-margin", "flatten-pdf", "repair-pdf", "protect-pdf", "unlock-pdf", "redact-pdf", "safe-to-share-auditor", "remove-hidden-metadata", "sign-pdf", "word-to-pdf", "excel-to-pdf", "powerpoint-to-pdf", "openoffice-to-pdf", "ebook-to-pdf", "iwork-to-pdf", "autocad-to-pdf", "pdf-to-jpg", "pdf-to-png", "pdf-to-text", "extract-images", "pdf-to-word", "pdf-to-excel", "pdf-to-powerpoint"] as const;

export type SeoToolSlug = (typeof SEO_TOOL_SLUGS)[number];

const SLUG_TO_OVERRIDE_KEY: Record<SeoToolSlug, string> = {
  "pdf-merge": "pdfMerge",
  "pdf-split": "pdfSplit",
  "pdf-compress": "pdfCompress",
  "rotate-pdf": "pdfRotate",
  "crop-pdf": "pdfCrop",
  "delete-pdf-pages": "pdfDeletePages",
  "reorder-pdf-pages": "pdfReorderPages",
  "extract-pdf-pages": "pdfExtractPages",
  "add-page-numbers": "pdfAddPageNumbers",
  "add-watermark": "pdfAddWatermark",
  "annotate-pdf": "pdfAnnotate",
  "compare-pdf": "pdfCompare",
  "pdf-to-booklet": "pdfToBooklet",
  "batch-rename-pdf": "pdfBatchRename",
  "pdf-text-editor": "pdfTextEditor",
  "custom-paper-margin": "pdfPaperMargin",
  "flatten-pdf": "pdfFlatten",
  "repair-pdf": "pdfRepair",
  "protect-pdf": "pdfProtect",
  "unlock-pdf": "pdfUnlock",
  "redact-pdf": "pdfRedact",
  "safe-to-share-auditor": "pdfSafeShareAuditor",
  "remove-hidden-metadata": "pdfRemoveMetadata",
  "sign-pdf": "pdfSign",
  "word-to-pdf": "wordToPdf",
  "excel-to-pdf": "excelToPdf",
  "powerpoint-to-pdf": "powerpointToPdf",
  "openoffice-to-pdf": "openofficeToPdf",
  "ebook-to-pdf": "ebookToPdf",
  "iwork-to-pdf": "iworkToPdf",
  "autocad-to-pdf": "autocadToPdf",
  "pdf-to-jpg": "pdfToJpg",
  "pdf-to-png": "pdfToPng",
  "pdf-to-text": "pdfToText",
  "extract-images": "extractImages",
  "pdf-to-word": "pdfToWord",
  "pdf-to-excel": "pdfToExcel",
  "pdf-to-powerpoint": "pdfToPowerpoint",
};

const COMPLEMENTARY_TOOL_HREF: Partial<Record<SeoToolSlug, string>> = {
  "pdf-merge": "/tools/pdf-split/",
  "pdf-split": "/tools/pdf-merge/",
  "pdf-to-word": "/tools/word-to-pdf/",
  "word-to-pdf": "/tools/pdf-to-word/",
  "pdf-to-excel": "/tools/excel-to-pdf/",
  "excel-to-pdf": "/tools/pdf-to-excel/",
  "pdf-to-powerpoint": "/tools/powerpoint-to-pdf/",
  "powerpoint-to-pdf": "/tools/pdf-to-powerpoint/",
};

export type ToolSeoBenefitCard = {
  icon: string;
  title: string;
  body: string;
};

export type ToolSeoPageOverride = {
  slug: SeoToolSlug;
  overrideKey: string;
  h1: string;
  heroTagline?: string;
  introSectionTitle: string;
  whySectionTitle: string;
  whySectionSubheadline?: string;
  whyBenefits?: ToolSeoBenefitCard[];
  schemaDescription: string;
  featuredGuide?: {
    slug: string;
    label: string;
  };
  complementaryTool?: {
    href: string;
    prompt: string;
    linkLabel: string;
  };
  relatedWorkflowLinks?: {
    prompt: string;
    links: { href: string; label: string }[];
  };
};

const WHY_BENEFIT_ICONS = {
  lossless: "🎯",
  quality: "✨",
  local: "⚡",
} as const;

function readWhyBenefits(t: ToolPageTranslator, base: string): ToolSeoBenefitCard[] | undefined {
  const ids = Object.keys(WHY_BENEFIT_ICONS) as (keyof typeof WHY_BENEFIT_ICONS)[];
  if (!t.has(`${base}.whyBenefits.lossless.title`)) return undefined;

  return ids.map((id) => ({
    icon: WHY_BENEFIT_ICONS[id],
    title: t(`${base}.whyBenefits.${id}.title`),
    body: t(`${base}.whyBenefits.${id}.body`),
  }));
}

export function resolveToolSeoPageOverride(
  tool: ToolDefinition,
  variant: ToolVariant | null,
  t: ToolPageTranslator,
): ToolSeoPageOverride | null {
  if (variant) return null;
  if (!SEO_TOOL_SLUGS.includes(tool.slug as SeoToolSlug)) return null;

  const slug = tool.slug as SeoToolSlug;
  const key = SLUG_TO_OVERRIDE_KEY[slug];
  const base = `toolSeo.${key}`;

  if (!t.has(`${base}.h1`)) return null;

  const complementaryHref = COMPLEMENTARY_TOOL_HREF[slug];
  const complementaryTool =
    complementaryHref &&
    t.has(`${base}.complementaryTool.prompt`) &&
    t.has(`${base}.complementaryTool.linkLabel`)
      ? {
          href: complementaryHref,
          prompt: t(`${base}.complementaryTool.prompt`),
          linkLabel: t(`${base}.complementaryTool.linkLabel`),
        }
      : undefined;

  const featuredGuide =
    t.has(`${base}.featuredGuide.slug`) && t.has(`${base}.featuredGuide.label`)
      ? {
          slug: t(`${base}.featuredGuide.slug`),
          label: t(`${base}.featuredGuide.label`),
        }
      : undefined;

  const workflowLinkDefs = [
    { href: "/tools/pdf-merge/", labelKey: "mergeLabel" },
    { href: "/tools/pdf-split/", labelKey: "splitLabel" },
    { href: "/tools/rotate-pdf/", labelKey: "rotateLabel" },
    { href: "/tools/pdf-compress/", labelKey: "compressLabel" },
    { href: "/tools/delete-pdf-pages/", labelKey: "deleteLabel" },
    { href: "/tools/reorder-pdf-pages/", labelKey: "reorderLabel" },
    { href: "/tools/add-page-numbers/", labelKey: "pageNumbersLabel" },
    { href: "/tools/add-watermark/", labelKey: "watermarkLabel" },
    { href: "/tools/annotate-pdf/", labelKey: "annotateLabel" },
    { href: "/tools/crop-pdf/", labelKey: "cropLabel" },
    { href: "/tools/pdf-to-booklet/", labelKey: "bookletLabel" },
    { href: "/tools/flatten-pdf/", labelKey: "flattenLabel" },
    { href: "/tools/redact-pdf/", labelKey: "redactLabel" },
    { href: "/tools/safe-to-share-auditor/", labelKey: "auditorLabel" },
    { href: "/tools/unlock-pdf/", labelKey: "unlockLabel" },
    { href: "/tools/protect-pdf/", labelKey: "protectLabel" },
    { href: "/tools/pdf-to-png/", labelKey: "pngLabel" },
    { href: "/tools/pdf-to-jpg/", labelKey: "jpgLabel" },
    { href: "/tools/crop-image/", labelKey: "cropImageLabel" },
    { href: "/tools/word-to-pdf/", labelKey: "wordToPdfLabel" },
    { href: "/tools/pdf-to-text/", labelKey: "pdfToTextLabel" },
  ] as const;

  const workflowLinks = workflowLinkDefs
    .filter((def) => t.has(`${base}.relatedWorkflowLinks.${def.labelKey}`))
    .map((def) => ({
      href: def.href,
      label: t(`${base}.relatedWorkflowLinks.${def.labelKey}`),
    }));

  const relatedWorkflowLinks =
    t.has(`${base}.relatedWorkflowLinks.prompt`) && workflowLinks.length > 0
      ? {
          prompt: t(`${base}.relatedWorkflowLinks.prompt`),
          links: workflowLinks,
        }
      : undefined;

  return {
    slug,
    overrideKey: key,
    h1: t(`${base}.h1`),
    heroTagline: t.has(`${base}.heroTagline`) ? t(`${base}.heroTagline`) : undefined,
    introSectionTitle: t(`${base}.introSectionTitle`),
    whySectionTitle: t(`${base}.whySectionTitle`),
    whySectionSubheadline: t.has(`${base}.whySectionSubheadline`)
      ? t(`${base}.whySectionSubheadline`)
      : undefined,
    whyBenefits: readWhyBenefits(t, base),
    schemaDescription: t(`${base}.schemaDescription`),
    featuredGuide,
    complementaryTool,
    relatedWorkflowLinks,
  };
}
