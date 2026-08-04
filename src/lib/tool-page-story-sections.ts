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

function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveToolName(slug: string, headline?: string | null): string {
  const fromShell = (headline || "").trim();
  if (fromShell) return normalizeToolNameForDocH1(fromShell);

  const inventory = getToolsInventoryEntry(slug);
  if (inventory?.name) return normalizeToolNameForDocH1(inventory.name);

  const registryTool = registry.tools.find((entry) => entry.slug === slug);
  if (registryTool?.title) return normalizeToolNameForDocH1(registryTool.title);

  return normalizeToolNameForDocH1(titleCaseSlug(slug));
}

function resolveToolIntent(slug: string, tagline?: string | null, subline?: string | null): string {
  const fromShell = (tagline || subline || "").trim();
  if (fromShell) return fromShell.replace(/\s+/g, " ");

  const registryTool = registry.tools.find((entry) => entry.slug === slug);
  return (registryTool?.intent || registryTool?.description || "").replace(/\s+/g, " ").trim();
}

function humanTask(toolName: string, intent: string): string {
  const lower = intent.toLowerCase();
  if (lower) {
    // Prefer a short clause from intent without repeating the tool name awkwardly.
    const clipped = intent.replace(/\.$/, "");
    if (clipped.length <= 140) return clipped.charAt(0).toLowerCase() + clipped.slice(1);
  }
  return `get this job done quickly with ${toolName}`;
}

function buildWhyParagraphs(toolName: string, intent: string): string[] {
  const task = humanTask(toolName, intent);
  const problem = intent
    ? `Most people open ${toolName} when they need to ${task} — for example, finishing a file before a meeting, cleaning something up for a client, or preparing an attachment without installing another desktop app.`
    : `Most people open ${toolName} when a file needs a quick fix before a meeting, a client delivery, or a deadline — without installing another desktop app or fighting a cluttered converter site.`;

  const brand =
    `On JoinMyPDF, ${toolName} is truly 100% free, processed locally in your browser, and built for the easiest, fastest, and most reliable experience we can ship. No account wall, no surprise paywall mid-task, and no waiting on a remote upload queue.`;

  return [problem, brand];
}

/** Practical usage FAQs — intentionally avoid privacy/local-processing themes. */
function buildUsageFaqs(toolName: string): ToolFaq[] {
  return [
    {
      q: `How do I use ${toolName}?`,
      a: `Open ${toolName}, add your file (or paste your input if the tool supports it), adjust any options you need, then run the action. When it finishes, download or copy the result and continue your workflow.`,
    },
    {
      q: `What should I prepare before I start?`,
      a: `Have the source file ready on your device and a clear outcome in mind (for example: merge pages, compress for email, or export a specific format). That way you can set options once and avoid re-running the tool.`,
    },
    {
      q: `Can I use ${toolName} on my phone or tablet?`,
      a: `Yes. ${toolName} works in modern mobile browsers. For larger files, a desktop or laptop browser is usually more comfortable, but the same steps apply on touch devices.`,
    },
    {
      q: `What if my file is large or takes a moment to process?`,
      a: `Keep the tab open until the progress indicator finishes. Very large files can take longer depending on your device. If something stalls, refresh the page and try again with a smaller batch or a single file.`,
    },
    {
      q: `Can I undo a change or start over?`,
      a: `Yes. Clear the current file or choose a new upload to reset the workspace. Your original file on disk is never overwritten — only the exported result is new.`,
    },
    {
      q: `Do I need an account to use ${toolName}?`,
      a: `No. You can use ${toolName} without creating an account or signing in. Open the page, complete the task, and download your result.`,
    },
    {
      q: `Which browsers work best with ${toolName}?`,
      a: `Current versions of Chrome, Edge, Firefox, and Safari work well. For the smoothest experience, keep your browser updated and allow the page enough memory when working with bigger files.`,
    },
  ];
}

const STORY_PARAGRAPHS = [
  "I built JoinMyPDF because I kept running into the same frustration: I needed a fast, clean, reliable tool online, and almost every option was buried under ads, pop-ups, or unnecessary friction.",
  "I still develop this platform actively for my own work, and my family uses these tools regularly too — so every improvement has to hold up in real everyday use, not just look good on a landing page.",
];

/**
 * English-only story block content for individual tool pages
 * (Why / FAQ / Creator note / Reviews), personalized by tool name.
 */
export function buildToolPageStoryContent(
  slug: string,
  options?: { headline?: string | null; tagline?: string | null; subline?: string | null },
): ToolPageStoryContent | null {
  if (!slug) return null;

  const toolName = resolveToolName(slug, options?.headline);
  const intent = resolveToolIntent(slug, options?.tagline, options?.subline);
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
    whyHeading: `Why People Use ${toolName}`,
    whyParagraphs: buildWhyParagraphs(toolName, intent),
    faqHeading: "Frequently Asked Questions",
    faqs: buildUsageFaqs(toolName),
    storyHeading: "A Note From the Creator",
    storyParagraphs: STORY_PARAGRAPHS,
    reviewsHeading: `What People Say About ${toolName}`,
    reviewsIntro: `Short recommendations from people who use ${toolName} for everyday work.`,
    reviews: seedReviews,
  };
}
