"use client";

import { StarRating } from "@/components/StarRating";
import {
  AppOverlayModal,
  type AppOverlayModalTone,
} from "@/components/AppOverlayModal";
import { useToolRating } from "@/hooks/useToolRating";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentColor,
  getContrastingInk,
  resolveToolAccentCategoryId,
} from "@/lib/category-accent-colors";
import { formatRatingAverage, formatExactRatingCount } from "@/lib/tool-rating";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type RateToolModalProps = {
  open: boolean;
  slug: string;
  /** When known (banner rating), prefer this over slug resolution. */
  categoryId?: InventoryCategoryId;
  onClose: () => void;
  onOpenReviews: () => void;
};

function safeT(
  t: ReturnType<typeof useTranslations>,
  key: string,
  fallback: string,
  values?: Record<string, string | number>,
): string {
  try {
    if (typeof t.has === "function" && t.has(key)) {
      return values ? t(key, values) : t(key);
    }
  } catch {
    /* missing message */
  }
  return fallback;
}

/** Build a readable solid-fill tone from the tool category accent. */
export function buildRateToolModalTone(accentHex: string): AppOverlayModalTone {
  const foreground = getContrastingInk(accentHex);
  const onLight = foreground === "#000000";
  return {
    background: accentHex,
    foreground,
    muted: onLight ? "rgba(0, 0, 0, 0.68)" : "rgba(255, 255, 255, 0.86)",
    closeHoverBackground: onLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.14)",
    primaryButtonBackground: foreground,
    primaryButtonForeground: accentHex,
    secondaryButtonBackground: onLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.14)",
    secondaryButtonBorder: onLight ? "rgba(0, 0, 0, 0.22)" : "rgba(255, 255, 255, 0.35)",
    secondaryButtonForeground: foreground,
  };
}

/**
 * Lightweight rating dialog opened from the title-banner score chip.
 * Panel fill matches the tool category accent; corners are square.
 */
export function RateToolModal({
  open,
  slug,
  categoryId,
  onClose,
  onOpenReviews,
}: RateToolModalProps) {
  const tCard = useTranslations("ToolCard");
  const tModal = useTranslations("ToolModal");
  const { userRating, stats, hydrated, rate } = useToolRating(slug);

  const tone = useMemo(() => {
    const resolved =
      categoryId ?? resolveToolAccentCategoryId(slug) ?? ("pdf" as InventoryCategoryId);
    return buildRateToolModalTone(getCategoryAccentColor(resolved));
  }, [categoryId, slug]);

  const exactCount = formatExactRatingCount(stats.count);
  const countLabel =
    stats.count === 0
      ? safeT(tCard, "noRatingsYet", "No ratings yet")
      : stats.count === 1
        ? safeT(tCard, "ratingOne", "1 rating")
        : safeT(tCard, "ratingsCount", `${exactCount} ratings`, { count: exactCount });

  const title = safeT(
    tModal,
    "rateThisTool",
    safeT(tCard, "rateThisTool", "Rate this tool"),
  );

  return (
    <AppOverlayModal
      open={open}
      title={title}
      onClose={onClose}
      closeLabel={safeT(tModal, "done", "Done")}
      tone={tone}
      className="rate-tool-modal"
      footer={
        <div className="app-overlay-modal__actions">
          <button
            type="button"
            className="app-overlay-modal__btn app-overlay-modal__btn--secondary"
            onClick={() => {
              onOpenReviews();
              onClose();
            }}
          >
            {safeT(tModal, "writeReview", "Write a review")}
          </button>
          <button
            type="button"
            className="app-overlay-modal__btn app-overlay-modal__btn--primary"
            onClick={onClose}
          >
            {safeT(tModal, "done", "Done")}
          </button>
        </div>
      }
    >
      {hydrated ? (
        <>
          <p className="app-overlay-modal__text" dir="ltr">
            {formatRatingAverage(stats.average)} · {countLabel}
          </p>
          <div className="app-overlay-modal__stars">
            <StarRating
              value={userRating ?? 0}
              onChange={userRating == null ? rate : undefined}
              readOnly={userRating != null}
              size="lg"
              color={tone.foreground}
              label={
                userRating == null
                  ? safeT(tCard, "rateThisTool", "Rate this tool")
                  : safeT(tCard, "yourRatingAria", `Your rating: ${userRating} out of 5`, {
                      rating: userRating,
                    })
              }
            />
          </div>
          {userRating != null ? (
            <p className="app-overlay-modal__text" role="status">
              {safeT(tCard, "thanks", "Thanks!")}
            </p>
          ) : (
            <p className="app-overlay-modal__text">
              {safeT(
                tModal,
                "rateHint",
                "Tap a star to leave your score. It stays on this device.",
              )}
            </p>
          )}
        </>
      ) : (
        <p className="app-overlay-modal__text">…</p>
      )}
    </AppOverlayModal>
  );
}
