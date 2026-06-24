import type { Metadata } from "next";
import type { ToolDefinition, ToolVariant } from "./types";
import { getBrandName } from "./brand";
import { translateToolItem } from "./i18n-tool-labels";
import type { ToolsTranslator } from "./i18n-tool-page";
import { buildDefaultSocialImages, localeOgImageUrl } from "./og-images";
import { siteUrl } from "./site";

const META_DESCRIPTION_MAX = 155;

function sentenceCase(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function truncateMetaDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

type ToolPageTranslator = {
  (key: string, values?: Record<string, string>): string;
  has: (key: string) => boolean;
};

export type ToolSeoCopy = {
  title: string;
  description: string;
  ogTitle: string;
};

export function buildToolSeoCopy(params: {
  tool: ToolDefinition;
  variant: ToolVariant | null;
  locale: string;
  tTools: ToolsTranslator | null;
  tPage: ToolPageTranslator | null;
}): ToolSeoCopy {
  const { tool, variant, tTools, tPage } = params;
  const toolTitle =
    tTools && tPage ? translateToolItem(tTools, tool.slug, tool.title) : tool.title;
  const kw = variant?.keyword || tool.primaryKeyword;
  const keyword = sentenceCase(kw);

  const titleTemplate = variant
    ? tPage?.has("metadata.variantTitleTemplate")
      ? tPage("metadata.variantTitleTemplate", { toolTitle, keyword })
      : `${toolTitle} — ${keyword} | Free, Secure & Fast | JoinMyPDF`
    : tPage?.has("metadata.titleTemplate")
      ? tPage("metadata.titleTemplate", { toolTitle })
      : `${toolTitle} — Free, Secure & Fast in Browser | JoinMyPDF`;

  const descriptionTemplate = variant
    ? tPage?.has("metadata.variantDescriptionTemplate")
      ? tPage("metadata.variantDescriptionTemplate", { toolTitle, keyword })
      : `${toolTitle} free for “${keyword}” — secure in-browser processing, no uploads, fast and unlimited. JoinMyPDF.`
    : tPage?.has("metadata.descriptionTemplate")
      ? tPage("metadata.descriptionTemplate", { toolTitle })
      : `${toolTitle} free and secure in your browser. No server uploads, full privacy, fast and unlimited. JoinMyPDF.`;

  const description = truncateMetaDescription(descriptionTemplate);
  const ogTitle = variant ? `${toolTitle} · ${keyword}` : toolTitle;

  return { title: titleTemplate, description, ogTitle };
}

export function buildToolMetadata(params: {
  tool: ToolDefinition;
  variant: ToolVariant | null;
  slug: string;
}): Metadata {
  return buildLocalizedToolMetadata({ ...params, locale: "en", tTools: null, tPage: null });
}

export function buildLocalizedToolMetadata(params: {
  tool: ToolDefinition;
  variant: ToolVariant | null;
  slug: string;
  locale: string;
  tTools: ToolsTranslator | null;
  tPage: ToolPageTranslator | null;
}): Metadata {
  const { slug, locale } = params;
  const { title, description, ogTitle } = buildToolSeoCopy(params);
  const canonicalPath = `/${locale}/tools/${slug}/`;
  const social = buildDefaultSocialImages(locale, { alt: ogTitle });

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: ogTitle,
      description,
      url: canonicalPath,
      siteName: getBrandName(locale),
      type: "website",
      locale: locale === "he" ? "he_IL" : "en_US",
      ...social.openGraph,
    },
    twitter: {
      title: ogTitle,
      description,
      ...social.twitter,
    },
    robots: { index: true, follow: true },
  };
}

export function getToolFaqs(
  tool: ToolDefinition,
  variant: ToolVariant | null
): { q: string; a: string }[] {
  if (!variant && tool.faq?.length) return tool.faq;
  if (!variant) {
    return [
      {
        q: `Is ${tool.title} free for typical use?`,
        a: "Yes. JoinMyPDF does not require payment for standard in-browser processing of everyday documents.",
      },
      {
        q: "Do my files get uploaded to JoinMyPDF servers?",
        a: "These tools process files in your browser session. That helps keep sensitive documents off our infrastructure during processing.",
      },
      {
        q: "Do you add a watermark?",
        a: "Standard downloads from these tools are not watermarked by JoinMyPDF.",
      },
      {
        q: "Can I use this on a phone or tablet?",
        a: "Yes. The interface is responsive and works on modern mobile browsers.",
      },
    ];
  }
  const angle =
    variant.angle ||
    "We keep the flow short and highlight the controls that matter for your scenario.";
  return [
    {
      q: `Is this the same ${tool.title} experience as your main page?`,
      a: "Yes—the same controls and privacy model. This page uses clearer wording for a specific situation so you know what to expect before you start.",
    },
    {
      q: `What does “${variant.keyword}” mean in practice?`,
      a: angle,
    },
    {
      q: "Does this variant use a different backend than the main tool?",
      a: "No. You are still running the same in-browser workflow. Guidance and on-page context are tuned to your intent.",
    },
    {
      q: `Where is the general ${tool.title} page?`,
      a: `Use the navigation link to /tools/${tool.slug}/ for the all-purpose entry point.`,
    },
  ];
}

export function toolOgImageUrl(locale: string): string {
  return localeOgImageUrl(locale);
}
