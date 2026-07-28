import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { resolveToolHref } from "@/lib/tool-hierarchy";

/** Site-wide reviews (legacy / global form without a tool context). */
export const SITE_REVIEW_SLUG = "joinmypdf";

export type CommunityReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  /** Optional promotional website URL (stored normalized with https://). */
  websiteUrl?: string;
  createdAt: string;
  /** Tool this review was written on (`joinmypdf` = site-wide). */
  toolSlug: string;
  /** True for user-submitted reviews persisted in localStorage. */
  isUserSubmitted?: boolean;
};

export type CommunityReviewWithSource = CommunityReview & {
  toolTitle: string;
  toolHref: string;
};

const WEBSITE_MAX_LENGTH = 200;
const COMMENT_MAX_LENGTH = 800;
const AUTHOR_MAX_LENGTH = 60;

/** Popular tools that contribute seed cards to the global aggregator. */
export const GLOBAL_FEED_SEED_TOOL_SLUGS = [
  "image-combiner",
  "pdf-compress",
  "pdf-merge",
  "pdf-split",
  "jpg-to-pdf",
  "word-to-pdf",
  "video-to-mp3",
  "text-workspace",
  "pdf-to-png",
  "image-watermark",
  "favicon-generator",
  "hash-generator",
] as const;

type SeedTemplate = {
  author: string;
  rating: number;
  comment: (toolName: string) => string;
  websiteUrl?: string;
  dayOffset: number;
};

const SEED_TEMPLATES: readonly SeedTemplate[] = [
  {
    author: "Maya Chen",
    rating: 5,
    comment: (toolName) =>
      `${toolName} is exactly what I needed between client handoffs — local processing, no upload anxiety, and a clean Industrial Matte UI that stays out of the way.`,
    websiteUrl: "https://mayachen.design",
    dayOffset: 76,
  },
  {
    author: "Jordan Ellis",
    rating: 5,
    comment: (toolName) =>
      `Remote standup means shipping files fast. ${toolName} on JoinMyPDF means I never wait on a corporate VPN upload. Bookmarking this permanently.`,
    dayOffset: 55,
  },
  {
    author: "Priya Nair",
    rating: 4,
    comment: (toolName) =>
      `As a frontend engineer I care about local-first tooling. ${toolName} covers my checklist without an account wall. Would love a few more batch presets next.`,
    websiteUrl: "https://priyanair.dev",
    dayOffset: 30,
  },
  {
    author: "Sam Okonkwo",
    rating: 5,
    comment: (toolName) =>
      `Freelance editor here — ${toolName} before sending proofs. Dark UI is easy on the eyes during late revisions, and nothing leaves the browser.`,
    dayOffset: 13,
  },
  {
    author: "Elena Vogt",
    rating: 5,
    comment: (toolName) =>
      `We switched our studio checklist to ${toolName}. Same quality as desktop suites for everyday jobs, with zero cloud copy of client assets.`,
    websiteUrl: "https://elenavogt.studio",
    dayOffset: 42,
  },
  {
    author: "Chris Alvarez",
    rating: 4,
    comment: (toolName) =>
      `${toolName} is snappy on mid-range laptops. I leave a quick review whenever a privacy-first tool actually ships the feature I need.`,
    dayOffset: 21,
  },
];

/** Explicit overrides for tools that deserve more specific mock copy. */
const TOOL_SPECIFIC_SEEDS: Record<
  string,
  readonly Omit<CommunityReview, "toolSlug" | "isUserSubmitted">[]
> = {
  "image-combiner": [
    {
      id: "seed-image-combiner-maya",
      author: "Maya Chen",
      rating: 5,
      comment:
        "Image Combiner stitches before/after renovation shots in one export. Side-by-side layout is clean, and the PNG download is ready for client decks.",
      websiteUrl: "https://mayachen.design",
      createdAt: "2026-05-12T14:20:00.000Z",
    },
    {
      id: "seed-image-combiner-jordan",
      author: "Jordan Ellis",
      rating: 5,
      comment:
        "Combining product shots vertically used to mean opening Photoshop. Image Combiner does it in the browser with no upload — perfect for quick marketing comps.",
      createdAt: "2026-06-03T09:45:00.000Z",
    },
    {
      id: "seed-image-combiner-priya",
      author: "Priya Nair",
      rating: 4,
      comment:
        "Solid 2–4 image combiner. Alignment and export are predictable. Would love optional gutters, but this already replaces my old collage workflow.",
      websiteUrl: "https://priyanair.dev",
      createdAt: "2026-06-28T18:10:00.000Z",
    },
  ],
  "pdf-merge": [
    {
      id: "seed-pdf-merge-sam",
      author: "Sam Okonkwo",
      rating: 5,
      comment:
        "I merge client contracts and markups all day. PDF Merge keeps everything in the browser — faster than my old desktop suite and zero account friction.",
      createdAt: "2026-07-15T11:30:00.000Z",
    },
    {
      id: "seed-pdf-merge-elena",
      author: "Elena Vogt",
      rating: 5,
      comment:
        "Merging proposal packs before a pitch — PDF Merge is the only tool on our studio shortlist that never touches the cloud.",
      websiteUrl: "https://elenavogt.studio",
      createdAt: "2026-06-20T16:00:00.000Z",
    },
    {
      id: "seed-pdf-merge-chris",
      author: "Chris Alvarez",
      rating: 4,
      comment:
        "Drag-reorder pages, merge, done. Wish there were named presets for recurring packs, but the core merge is rock solid.",
      createdAt: "2026-05-28T10:15:00.000Z",
    },
  ],
  "pdf-compress": [
    {
      id: "seed-pdf-compress-jordan",
      author: "Jordan Ellis",
      rating: 5,
      comment:
        "Compress + send in one flow. Attachments finally fit email limits without me worrying about a third-party compressor retaining files.",
      createdAt: "2026-06-11T08:30:00.000Z",
    },
    {
      id: "seed-pdf-compress-maya",
      author: "Maya Chen",
      rating: 5,
      comment:
        "PDF Compress nails the quality/size balance for portfolio decks. Local-first is non-negotiable for unpublished work.",
      websiteUrl: "https://mayachen.design",
      createdAt: "2026-07-02T19:40:00.000Z",
    },
    {
      id: "seed-pdf-compress-priya",
      author: "Priya Nair",
      rating: 4,
      comment:
        "Good compression ratios for scan-heavy PDFs. Preview deltas help me reject a bad pass before download.",
      createdAt: "2026-05-19T13:05:00.000Z",
    },
  ],
};

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seedCreatedAt(dayOffset: number, hour: number): string {
  const date = new Date(Date.UTC(2026, 6, 28, hour, 0, 0));
  date.setUTCDate(date.getUTCDate() - dayOffset);
  return date.toISOString();
}

export function resolveReviewToolTitle(toolSlug: string, fallback?: string): string {
  if (toolSlug === SITE_REVIEW_SLUG) return "JoinMyPDF";
  return getToolsInventoryEntry(toolSlug)?.title ?? fallback ?? toolSlug;
}

export function resolveReviewToolHref(toolSlug: string, locale?: string): string {
  if (toolSlug === SITE_REVIEW_SLUG) return "/";
  return resolveToolHref(toolSlug, undefined, locale);
}

export function withReviewSource(
  review: CommunityReview,
  locale?: string,
  toolTitleFallback?: string,
): CommunityReviewWithSource {
  return {
    ...review,
    toolTitle: resolveReviewToolTitle(review.toolSlug, toolTitleFallback),
    toolHref: resolveReviewToolHref(review.toolSlug, locale),
  };
}

/**
 * Pre-seed a tool with a few relevant mock reviews when its local feed would
 * otherwise be empty (and as baseline social proof alongside user reviews).
 */
export function getSeedReviewsForTool(toolSlug: string): CommunityReview[] {
  if (toolSlug === SITE_REVIEW_SLUG) {
    return GLOBAL_FEED_SEED_TOOL_SLUGS.flatMap((slug) => getSeedReviewsForTool(slug)).slice(0, 4);
  }

  const specific = TOOL_SPECIFIC_SEEDS[toolSlug];
  if (specific) {
    return specific.map((review) => ({ ...review, toolSlug }));
  }

  const toolName = resolveReviewToolTitle(toolSlug);
  const start = hashSlug(toolSlug) % SEED_TEMPLATES.length;
  const count = 3;

  return Array.from({ length: count }, (_, index) => {
    const template = SEED_TEMPLATES[(start + index) % SEED_TEMPLATES.length]!;
    return {
      id: `seed-${toolSlug}-${index}`,
      author: template.author,
      rating: template.rating,
      comment: template.comment(toolName),
      websiteUrl: template.websiteUrl,
      createdAt: seedCreatedAt(template.dayOffset + index * 3, 10 + index * 2),
      toolSlug,
    } satisfies CommunityReview;
  });
}

/** Seed cards shown on the centralized global aggregator. */
export function getGlobalSeedReviews(): CommunityReview[] {
  return GLOBAL_FEED_SEED_TOOL_SLUGS.flatMap((slug) => getSeedReviewsForTool(slug));
}

/** @deprecated Prefer getGlobalSeedReviews / getSeedReviewsForTool. */
export const SEED_COMMUNITY_REVIEWS: CommunityReview[] = getGlobalSeedReviews().slice(0, 4);

export function normalizeWebsiteUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
  if (!parsed.hostname.includes(".")) return undefined;
  if (withProtocol.length > WEBSITE_MAX_LENGTH) return undefined;

  return parsed.toString();
}

export function formatWebsiteDisplay(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host + (parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, ""));
  } catch {
    return url;
  }
}

export type ReviewDraft = {
  author: string;
  rating: number;
  comment: string;
  websiteUrl?: string;
  toolSlug: string;
};

export type ReviewValidationError =
  | "author_required"
  | "rating_required"
  | "comment_required"
  | "website_invalid"
  | "tool_required";

export function validateReviewDraft(draft: {
  author: unknown;
  rating: unknown;
  comment: unknown;
  websiteUrl?: unknown;
  toolSlug?: unknown;
}): { ok: true; data: ReviewDraft } | { ok: false; error: ReviewValidationError } {
  const author = typeof draft.author === "string" ? draft.author.trim() : "";
  const comment = typeof draft.comment === "string" ? draft.comment.trim() : "";
  const toolSlug = typeof draft.toolSlug === "string" ? draft.toolSlug.trim() : "";
  const rating =
    typeof draft.rating === "number"
      ? draft.rating
      : typeof draft.rating === "string"
        ? Number(draft.rating)
        : NaN;
  const websiteRaw =
    typeof draft.websiteUrl === "string" ? draft.websiteUrl.trim() : "";

  if (!author || author.length > AUTHOR_MAX_LENGTH) {
    return { ok: false, error: "author_required" };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "rating_required" };
  }
  if (!comment || comment.length > COMMENT_MAX_LENGTH) {
    return { ok: false, error: "comment_required" };
  }
  if (!toolSlug) {
    return { ok: false, error: "tool_required" };
  }

  let websiteUrl: string | undefined;
  if (websiteRaw) {
    websiteUrl = normalizeWebsiteUrl(websiteRaw);
    if (!websiteUrl) return { ok: false, error: "website_invalid" };
  }

  return {
    ok: true,
    data: { author, rating, comment, websiteUrl, toolSlug },
  };
}

export const REVIEW_LIMITS = {
  authorMax: AUTHOR_MAX_LENGTH,
  commentMax: COMMENT_MAX_LENGTH,
  websiteMax: WEBSITE_MAX_LENGTH,
} as const;
