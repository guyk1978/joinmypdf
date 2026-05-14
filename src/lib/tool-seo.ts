import type { Metadata } from "next";
import type { ToolDefinition, ToolVariant } from "./types";
import { siteUrl } from "./site";

export function buildToolMetadata(params: {
  tool: ToolDefinition;
  variant: ToolVariant | null;
  slug: string;
}): Metadata {
  const { tool, variant, slug } = params;
  const kw = variant?.keyword || tool.primaryKeyword;
  const title = variant
    ? `${tool.title} — ${sentenceCase(kw)} | JoinMyPDF`
    : `${tool.title} — Free in your browser | JoinMyPDF`;
  const description = variant
    ? `${tool.title} for searches like “${kw}”. ${tool.description} Private in-browser processing, no watermark on standard output, no forced account for typical use.`
    : `${tool.description} Private in-browser processing, no watermark on standard output, no forced account for typical use.`;

  const canonicalPath = `/tools/${slug}/`;
  const ogTitle = variant ? `${tool.title} · ${sentenceCase(kw)}` : tool.title;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: ogTitle,
      description,
      url: canonicalPath,
      siteName: "JoinMyPDF",
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
    robots: { index: true, follow: true },
  };
}

function sentenceCase(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
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

export function toolOgImageUrl(): string | undefined {
  return undefined;
}
