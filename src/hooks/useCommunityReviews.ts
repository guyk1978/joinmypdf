"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SEED_COMMUNITY_REVIEWS,
  type CommunityReview,
  type ReviewDraft,
} from "@/data/community-reviews";

export const COMMUNITY_REVIEWS_STORAGE_KEY = "joinmypdf-community-reviews";
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
    (item.websiteUrl === undefined || typeof item.websiteUrl === "string")
  );
}

function readUserReviews(): CommunityReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMMUNITY_REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCommunityReview).map((review) => ({
      ...review,
      isUserSubmitted: true,
    }));
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

export function useCommunityReviews() {
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

  const reviews = useMemo(
    () => [...userReviews, ...SEED_COMMUNITY_REVIEWS].sort(sortByNewest),
    [userReviews],
  );

  const addReview = useCallback((draft: ReviewDraft) => {
    const next: CommunityReview = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: draft.author,
      rating: draft.rating,
      comment: draft.comment,
      websiteUrl: draft.websiteUrl,
      createdAt: new Date().toISOString(),
      isUserSubmitted: true,
    };
    const merged = [next, ...readUserReviews()];
    writeUserReviews(merged);
    setUserReviews(merged);
    return next;
  }, []);

  return { reviews, addReview, hydrated };
}
