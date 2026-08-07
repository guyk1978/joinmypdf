import type { ToolFaq } from "@/lib/types";
import { getSeedReviewsForTool, type CommunityReview } from "@/data/community-reviews";
import { registry } from "@/lib/registry";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { normalizeToolNameForDocH1 } from "@/lib/tool-doc-h1";

export type ToolPageStoryContent = {
  toolName: string;
  whyHeading: string;
  whyParagraphs: string[];
  faqHeading: string;
  faqs: ToolFaq[];
  storyHeading: string;
  storyParagraphs: string[];
  reviewsHeading: string;
  reviewsIntro: string;
  reviews: Array<Pick<CommunityReview, "id" | "author" | "rating" | "comment">>;
};

/** Locale-aware templates for Why / FAQ / Creator / Reviews on tool pages. */
export type ToolPageStoryTemplates = {
  whyHeading: string;
  whyWithTask: string;
  whyFallback: string;
  whyBrand: string;
  faqHeading: string;
  faqUseQ: string;
  faqUseA: string;
  faqPrepareQ: string;
  faqPrepareA: string;
  faqMobileQ: string;
  faqMobileA: string;
  faqLargeQ: string;
  faqLargeA: string;
  faqUndoQ: string;
  faqUndoA: string;
  faqAccountQ: string;
  faqAccountA: string;
  faqBrowsersQ: string;
  faqBrowsersA: string;
  storyHeading: string;
  storyP1: string;
  storyP2: string;
  reviewsHeading: string;
  reviewsIntro: string;
};

function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, "g"), value),
    template,
  ).replace(/\s+/g, " ").trim();
}

function resolveToolName(slug: string, headline?: string | null): string {
  const fromShell = (headline || "").trim();
  if (fromShell) return normalizeToolNameForDocH1(fromShell);

  const inventory = getToolsInventoryEntry(slug);
  if (inventory?.title) return normalizeToolNameForDocH1(inventory.title);

  const registryTool = registry.tools.find((entry) => entry.slug === slug);
  if (registryTool?.title) return normalizeToolNameForDocH1(registryTool.title);

  return normalizeToolNameForDocH1(titleCaseSlug(slug));
}

function resolveToolIntent(
  slug: string,
  locale: string,
  tagline?: string | null,
  subline?: string | null,
): string {
  const fromShell = (tagline || subline || "").trim();
  if (fromShell) return fromShell.replace(/\s+/g, " ");

  // Never inject English registry prose into non-English pages.
  if (locale !== "en") return "";

  const registryTool = registry.tools.find((entry) => entry.slug === slug);
  return (registryTool?.intent || registryTool?.description || "").replace(/\s+/g, " ").trim();
}

function humanTask(toolName: string, intent: string, locale: string): string {
  const clipped = intent.replace(/\.$/, "").trim();
  if (!clipped) return "";

  // Only apply English sentence-case trim for Latin intents.
  if (locale === "en" && clipped.length <= 140) {
    return clipped.charAt(0).toLowerCase() + clipped.slice(1);
  }
  if (clipped.length <= 140) return clipped;
  return `get this job done quickly with ${toolName}`;
}

function buildWhyParagraphs(
  toolName: string,
  intent: string,
  locale: string,
  templates: ToolPageStoryTemplates,
): string[] {
  const task = humanTask(toolName, intent, locale);
  const problem = task
    ? fill(templates.whyWithTask, { toolName, task })
    : fill(templates.whyFallback, { toolName });
  const brand = fill(templates.whyBrand, { toolName });
  return [problem, brand];
}

/** Practical usage FAQs — intentionally avoid privacy/local-processing themes. */
function buildUsageFaqs(toolName: string, templates: ToolPageStoryTemplates): ToolFaq[] {
  const vars = { toolName };
  return [
    { q: fill(templates.faqUseQ, vars), a: fill(templates.faqUseA, vars) },
    { q: fill(templates.faqPrepareQ, vars), a: fill(templates.faqPrepareA, vars) },
    { q: fill(templates.faqMobileQ, vars), a: fill(templates.faqMobileA, vars) },
    { q: fill(templates.faqLargeQ, vars), a: fill(templates.faqLargeA, vars) },
    { q: fill(templates.faqUndoQ, vars), a: fill(templates.faqUndoA, vars) },
    { q: fill(templates.faqAccountQ, vars), a: fill(templates.faqAccountA, vars) },
    { q: fill(templates.faqBrowsersQ, vars), a: fill(templates.faqBrowsersA, vars) },
  ];
}

export const DEFAULT_TOOL_PAGE_STORY_TEMPLATES_EN: ToolPageStoryTemplates = {
  whyHeading: "Why People Use {toolName}",
  whyWithTask:
    "Most people open {toolName} when they need to {task} — for example, finishing a file before a meeting, cleaning something up for a client, or preparing an attachment without installing another desktop app.",
  whyFallback:
    "Most people open {toolName} when a file needs a quick fix before a meeting, a client delivery, or a deadline — without installing another desktop app or fighting a cluttered converter site.",
  whyBrand:
    "On JoinMyPDF, {toolName} is truly 100% free, processed locally in your browser, and built for the easiest, fastest, and most reliable experience we can ship. No account wall, no surprise paywall mid-task, and no waiting on a remote upload queue.",
  faqHeading: "Frequently Asked Questions",
  faqUseQ: "How do I use {toolName}?",
  faqUseA:
    "Open {toolName}, add your file (or paste your input if the tool supports it), adjust any options you need, then run the action. When it finishes, download or copy the result and continue your workflow.",
  faqPrepareQ: "What should I prepare before I start?",
  faqPrepareA:
    "Have the source file ready on your device and a clear outcome in mind (for example: merge pages, compress for email, or export a specific format). That way you can set options once and avoid re-running the tool.",
  faqMobileQ: "Can I use {toolName} on my phone or tablet?",
  faqMobileA:
    "Yes. {toolName} works in modern mobile browsers. For larger files, a desktop or laptop browser is usually more comfortable, but the same steps apply on touch devices.",
  faqLargeQ: "What if my file is large or takes a moment to process?",
  faqLargeA:
    "Keep the tab open until the progress indicator finishes. Very large files can take longer depending on your device. If something stalls, refresh the page and try again with a smaller batch or a single file.",
  faqUndoQ: "Can I undo a change or start over?",
  faqUndoA:
    "Yes. Clear the current file or choose a new upload to reset the workspace. Your original file on disk is never overwritten — only the exported result is new.",
  faqAccountQ: "Do I need an account to use {toolName}?",
  faqAccountA:
    "No. You can use {toolName} without creating an account or signing in. Open the page, complete the task, and download your result.",
  faqBrowsersQ: "Which browsers work best with {toolName}?",
  faqBrowsersA:
    "Current versions of Chrome, Edge, Firefox, and Safari work well. For the smoothest experience, keep your browser updated and allow the page enough memory when working with bigger files.",
  storyHeading: "A Note From the Creator",
  storyP1:
    "I built JoinMyPDF because I kept running into the same frustration: I needed a fast, clean, reliable tool online, and almost every option was buried under ads, pop-ups, or unnecessary friction.",
  storyP2:
    "I still develop this platform actively for my own work, and my family uses these tools regularly too — so every improvement has to hold up in real everyday use, not just look good on a landing page.",
  reviewsHeading: "What People Say About {toolName}",
  reviewsIntro: "Short recommendations from people who use {toolName} for everyday work.",
};

/**
 * Story block content for individual tool pages
 * (Why / FAQ / Creator note / Reviews), personalized by tool name.
 */
export function buildToolPageStoryContent(
  slug: string,
  options?: {
    headline?: string | null;
    tagline?: string | null;
    subline?: string | null;
    locale?: string;
    templates?: ToolPageStoryTemplates;
  },
): ToolPageStoryContent | null {
  if (!slug) return null;

  const locale = options?.locale ?? "en";
  const templates = options?.templates ?? DEFAULT_TOOL_PAGE_STORY_TEMPLATES_EN;
  const toolName = resolveToolName(slug, options?.headline);
  const intent = resolveToolIntent(slug, locale, options?.tagline, options?.subline);
  const seedReviews = getSeedReviewsForTool(slug)
    .slice(0, 3)
    .map((review) => ({
      id: review.id,
      author: review.author,
      rating: review.rating,
      comment: review.comment,
    }));

  return {
    toolName,
    whyHeading: fill(templates.whyHeading, { toolName }),
    whyParagraphs: buildWhyParagraphs(toolName, intent, locale, templates),
    faqHeading: templates.faqHeading,
    faqs: buildUsageFaqs(toolName, templates),
    storyHeading: templates.storyHeading,
    storyParagraphs: [templates.storyP1, templates.storyP2],
    reviewsHeading: fill(templates.reviewsHeading, { toolName }),
    reviewsIntro: fill(templates.reviewsIntro, { toolName }),
    reviews: seedReviews,
  };
}
