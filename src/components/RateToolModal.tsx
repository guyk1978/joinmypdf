"use client";

import { StarRating } from "@/components/StarRating";
import { AppOverlayModal } from "@/components/AppOverlayModal";
import { useToolRating } from "@/hooks/useToolRating";
import { formatRatingAverage, formatExactRatingCount } from "@/lib/tool-rating";
import { useTranslations } from "next-intl";

type RateToolModalProps = {
  open: boolean;
  slug: string;
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

/**
 * Lightweight rating dialog opened from the title-banner score chip.
 */
export function RateToolModal({ open, slug, onClose, onOpenReviews }: RateToolModalProps) {
  const tCard = useTranslations("ToolCard");
  const tModal = useTranslations("ToolModal");
  const { userRating, stats, hydrated, rate } = useToolRating(slug);

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
