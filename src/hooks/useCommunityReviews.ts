"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SITE_REVIEW_SLUG,
  getGlobalSeedReviews,
  getSeedReviewsForTool,
  withReviewSource,
  type CommunityReview,
  type CommunityReviewWithSource,
  type ReviewDraft,
} from "@/data/community-reviews";

export const COMMUNITY_REVIEWS_STORAGE_KEY = "joinmypdf-community-reviews-v2";
export const COMMUNITY_REVIEWS_LEGACY_STORAGE_KEY = "joinmypdf-community-reviews";
export const COMMUNITY_REVIEWS_CHANGE_EVENT = "joinmypdf-community-reviews-change";

function isCommunityReview(value: unknown): value is CommunityReview {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.author === "string" &&
    typeof item.rating === "number" &&
    typeof item.comment === "string" &&
    typeof item.createdAt === "string" &&
    (item.websiteUrl === undefined || typeof item.websiteUrl === "string") &&
    (item.toolSlug === undefined || typeof item.toolSlug === "string")
  );
}

function normalizeStoredReview(value: CommunityReview): CommunityReview {
  return {
    ...value,
    toolSlug: value.toolSlug?.trim() || SITE_REVIEW_SLUG,
    isUserSubmitted: true,
  };
}

function readUserReviews(): CommunityReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(COMMUNITY_REVIEWS_STORAGE_KEY) ??
      window.localStorage.getItem(COMMUNITY_REVIEWS_LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCommunityReview).map(normalizeStoredReview);
  } catch {
    return [];
  }
}

function writeUserReviews(reviews: CommunityReview[]) {
  window.localStorage.setItem(COMMUNITY_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new CustomEvent(COMMUNITY_REVIEWS_CHANGE_EVENT));
}

function sortByNewest(a: CommunityReview, b: CommunityReview) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export type UseCommunityReviewsOptions = {
  /** When set, scope the feed + submissions to this tool. */
  toolSlug?: string;
  /** Locale used to resolve tool hrefs for source attribution. */
  locale?: string;
  /** Display title override for the scoped tool. */
  toolTitle?: string;
};

export function useCommunityReviews(options: UseCommunityReviewsOptions = {}) {
  const { toolSlug, locale, toolTitle } = options;
  const [userReviews, setUserReviews] = useState<CommunityReview[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUserReviews(readUserReviews());
    setHydrated(true);

    const sync = () => setUserReviews(readUserReviews());
    window.addEventListener(COMMUNITY_REVIEWS_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMMUNITY_REVIEWS_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const reviews = useMemo((): CommunityReviewWithSource[] => {
    if (toolSlug) {
      const scopedUser = userReviews.filter((review) => review.toolSlug === toolSlug);
      // Pre-seed when the local tool feed has no user submissions yet.
      const seeds = scopedUser.length === 0 ? getSeedReviewsForTool(toolSlug) : [];
      return [...scopedUser, ...seeds]
        .sort(sortByNewest)
        .map((review) => withReviewSource(review, locale, toolTitle));
    }

    const seeds = getGlobalSeedReviews();
    const seen = new Set<string>();
    const merged: CommunityReview[] = [];
    for (const review of [...userReviews, ...seeds].sort(sortByNewest)) {
      if (seen.has(review.id)) continue;
      seen.add(review.id);
      merged.push(review);
    }
    return merged.map((review) => withReviewSource(review, locale));
  }, [locale, toolSlug, toolTitle, userReviews]);

  const addReview = useCallback(
    (draft: ReviewDraft) => {
      const next: CommunityReview = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        author: draft.author,
        rating: draft.rating,
        comment: draft.comment,
        websiteUrl: draft.websiteUrl,
        createdAt: new Date().toISOString(),
        toolSlug: draft.toolSlug || toolSlug || SITE_REVIEW_SLUG,
        isUserSubmitted: true,
      };
      const merged = [next, ...readUserReviews()];
      writeUserReviews(merged);
      setUserReviews(merged);
      return next;
    },
    [toolSlug],
  );

  return { reviews, addReview, hydrated, toolSlug };
}
