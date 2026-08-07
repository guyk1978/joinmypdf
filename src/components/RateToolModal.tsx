"use client";

import { StarRating } from "@/components/StarRating";
import {
  AppOverlayModal,
  type AppOverlayModalTone,
} from "@/components/AppOverlayModal";
import { useToolRating } from "@/hooks/useToolRating";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { formatRatingAverage, formatExactRatingCount } from "@/lib/tool-rating";
import { useTranslations } from "next-intl";

type RateToolModalProps = {
  open: boolean;
  slug: string;
  /** Kept for call-site compatibility; no longer drives panel color. */
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

/** Sitewide industrial rating tone — dark surface + emerald actions (no category rainbow). */
export const INDUSTRIAL_RATE_MODAL_TONE: AppOverlayModalTone = {
  background: "#121212",
  foreground: "#f5f5f5",
  muted: "#a3a3a3",
  closeHoverBackground: "rgba(255, 255, 255, 0.08)",
  primaryButtonBackground: "#34d399",
  primaryButtonForeground: "#04140e",
  secondaryButtonBackground: "rgba(255, 255, 255, 0.05)",
  secondaryButtonBorder: "rgba(255, 255, 255, 0.14)",
  secondaryButtonForeground: "#f5f5f5",
};

/**
 * @deprecated Category accent fills were retired — always returns industrial tone.
 */
export function buildRateToolModalTone(_accentHex?: string): AppOverlayModalTone {
  return INDUSTRIAL_RATE_MODAL_TONE;
}

/**
 * Lightweight rating dialog opened from the title-banner score chip.
 * Industrial dark panel + emerald primary — same chrome sitewide.
 */
export function RateToolModal({
  open,
  slug,
  onClose,
  onOpenReviews,
}: RateToolModalProps) {
  const tCard = useTranslations("ToolCard");
  const tModal = useTranslations("ToolModal");
  const { userRating, stats, hydrated, rate } = useToolRating(slug);

  const tone = INDUSTRIAL_RATE_MODAL_TONE;

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
              color="#34d399"
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
