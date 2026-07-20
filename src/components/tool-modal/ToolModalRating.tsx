"use client";

import type { CSSProperties } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { StarRating } from "@/components/StarRating";
import { useToolRating } from "@/hooks/useToolRating";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentColor,
  getCategoryAccentCssVar,
} from "@/lib/category-accent-colors";
import { formatRatingAverage } from "@/lib/tool-rating";
import { formatCompactRatingCount } from "@/lib/text-direction";

type ToolModalRatingProps = {
  /** Canonical tool slug — unique Tool ID for localStorage. */
  slug?: string;
  categoryId?: InventoryCategoryId;
  labels?: {
    ratings?: string;
    thankYou?: string;
    rateAria?: string;
    yourRatingAria?: string;
  };
  className?: string;
};

/**
 * Tool-modal header rating — shares the same once-per-tool localStorage map
 * and category-accent StarRating as the Industrial Matte cards / Focus mode.
 */
export function ToolModalRating({
  slug,
  categoryId,
  labels,
  className,
}: ToolModalRatingProps) {
  const tCard = useTranslations("ToolCard");
  const { userRating, stats, hydrated, rate } = useToolRating(slug);
  const accent =
    (categoryId ? getCategoryAccentCssVar(categoryId) : undefined) ??
    getCategoryAccentColor("pdf");
  const style = { "--star-rating-color": accent } as CSSProperties;

  if (!slug || !hydrated) {
    return (
      <div
        className={clsx("tool-modal-rating", "tool-modal-rating--loading", className)}
        style={style}
        aria-hidden
      />
    );
  }

  const compactCount =
    stats.count >= 1000 ? formatCompactRatingCount(stats.count) : String(stats.count);

  const countLabel = labels?.ratings
    ? labels.ratings.replace("{count}", compactCount)
    : stats.count === 0
      ? tCard("noRatingsYet")
      : stats.count === 1
        ? tCard("ratingOne")
        : stats.count >= 1000
          ? tCard("ratingsCompact", { count: compactCount })
          : tCard("ratingsCount", { count: stats.count });

  const rateLabel =
    userRating == null
      ? (labels?.rateAria ?? tCard("rateThisTool"))
      : (labels?.yourRatingAria?.replace("{rating}", String(userRating)) ??
        tCard("yourRatingAria", { rating: userRating }));

  return (
    <div
      className={clsx(
        "tool-modal-rating",
        userRating != null && "tool-modal-rating--rated",
        className,
      )}
      style={style}
    >
      <StarRating
        value={userRating ?? stats.average ?? 0}
        onChange={userRating == null ? rate : undefined}
        readOnly={userRating != null}
        size="md"
        color={accent}
        label={rateLabel}
      />

      <span className="tool-modal-rating__label" aria-live="polite">
        {userRating != null ? (
          <span className="tool-modal-rating__thanks">
            {labels?.thankYou ?? tCard("thanks")}
          </span>
        ) : (
          <>
            <span className="tool-modal-rating__score" dir="ltr">
              {formatRatingAverage(stats.average)}
            </span>
            <span className="tool-modal-rating__count">{countLabel}</span>
          </>
        )}
      </span>
    </div>
  );
}
