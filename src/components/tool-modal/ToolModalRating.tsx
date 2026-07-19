"use client";

import type { CSSProperties } from "react";
import { clsx } from "clsx";
import { StarRating } from "@/components/StarRating";
import { useToolRating } from "@/hooks/useToolRating";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentColor,
  getCategoryAccentCssVar,
} from "@/lib/category-accent-colors";
import {
  formatRatingAverage,
  formatRatingCount,
} from "@/lib/tool-rating";

type ToolModalRatingProps = {
  /** Canonical tool slug — unique Tool ID for localStorage. */
  slug?: string;
  categoryId?: InventoryCategoryId;
  labels?: {
    ratings?: string;
    thankYou?: string;
    rateAria?: string;
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
    stats.count >= 1000
      ? stats.count >= 10000
        ? `${Math.round(stats.count / 1000)}k`
        : `${(stats.count / 1000).toFixed(1).replace(/\.0$/, "")}k`
      : String(stats.count);

  const countLabel = labels?.ratings
    ? labels.ratings.replace("{count}", compactCount)
    : formatRatingCount(stats.count);

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
        label={
          labels?.rateAria ??
          (userRating == null
            ? "Rate this tool"
            : `Your rating: ${userRating} out of 5`)
        }
      />

      <span className="tool-modal-rating__label" aria-live="polite">
        {userRating != null ? (
          <span className="tool-modal-rating__thanks">
            {labels?.thankYou ?? "Thanks!"}
          </span>
        ) : (
          <>
            <span className="tool-modal-rating__score">
              {formatRatingAverage(stats.average)}
            </span>
            <span className="tool-modal-rating__count">{countLabel}</span>
          </>
        )}
      </span>
    </div>
  );
}
