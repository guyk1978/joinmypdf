export type CommunityReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  /** Optional promotional website URL (stored normalized with https://). */
  websiteUrl?: string;
  createdAt: string;
  /** True for user-submitted reviews persisted in localStorage. */
  isUserSubmitted?: boolean;
};

/** Initial community feed — mix of promotional and plain reviews. */
export const SEED_COMMUNITY_REVIEWS: CommunityReview[] = [
  {
    id: "seed-maya-chen",
    author: "Maya Chen",
    rating: 5,
    comment:
      "I merge client contracts and markups all day. JoinMyPDF keeps everything in the browser — no upload anxiety, and the merge tool is faster than my old desktop suite.",
    websiteUrl: "https://mayachen.design",
    createdAt: "2026-05-12T14:20:00.000Z",
  },
  {
    id: "seed-jordan-ellis",
    author: "Jordan Ellis",
    rating: 5,
    comment:
      "Remote standup means sharing PDF decks constantly. Compress + split on JoinMyPDF means I never wait on a corporate VPN upload. Clean UI, zero account friction.",
    createdAt: "2026-06-03T09:45:00.000Z",
  },
  {
    id: "seed-priya-nair",
    author: "Priya Nair",
    rating: 4,
    comment:
      "As a frontend engineer I care about local-first tooling. PDF → PNG and the metadata wiper are solid. Would love batch rename presets next, but this already covers my release checklist.",
    websiteUrl: "https://priyanair.dev",
    createdAt: "2026-06-28T18:10:00.000Z",
  },
  {
    id: "seed-sam-okonkwo",
    author: "Sam Okonkwo",
    rating: 5,
    comment:
      "Freelance editor here — redact and watermark before sending proofs. Industrial dark UI is easy on the eyes during late revisions. Bookmarking JoinMyPDF permanently.",
    createdAt: "2026-07-15T11:30:00.000Z",
  },
];

const WEBSITE_MAX_LENGTH = 200;
const COMMENT_MAX_LENGTH = 800;
const AUTHOR_MAX_LENGTH = 60;

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
};

export type ReviewValidationError =
  | "author_required"
  | "rating_required"
  | "comment_required"
  | "website_invalid";

export function validateReviewDraft(draft: {
  author: unknown;
  rating: unknown;
  comment: unknown;
  websiteUrl?: unknown;
}): { ok: true; data: ReviewDraft } | { ok: false; error: ReviewValidationError } {
  const author = typeof draft.author === "string" ? draft.author.trim() : "";
  const comment = typeof draft.comment === "string" ? draft.comment.trim() : "";
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

  let websiteUrl: string | undefined;
  if (websiteRaw) {
    websiteUrl = normalizeWebsiteUrl(websiteRaw);
    if (!websiteUrl) return { ok: false, error: "website_invalid" };
  }

  return {
    ok: true,
    data: { author, rating, comment, websiteUrl },
  };
}

export const REVIEW_LIMITS = {
  authorMax: AUTHOR_MAX_LENGTH,
  commentMax: COMMENT_MAX_LENGTH,
  websiteMax: WEBSITE_MAX_LENGTH,
} as const;
