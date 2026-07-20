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

type ToolRatingSummaryProps = {
  /** Canonical tool slug — unique Tool ID for localStorage. */
  toolId: string;
  categoryId?: InventoryCategoryId;
  className?: string;
  showCount?: boolean;
  /** Override category accent (defaults to the tool's category color). */
  color?: string;
};

/**
 * Compact once-per-tool rating control for Industrial Matte cards and Focus
 * mode — synchronized with WattQuick's CalculatorRatingSummary. Stars and the
 * numerical average inherit the category accent; votes are keyed by `toolId`.
 */
export function ToolRatingSummary({
  toolId,
  categoryId,
  className,
  showCount = true,
  color,
}: ToolRatingSummaryProps) {
  const t = useTranslations("ToolCard");
  const { userRating, stats, hydrated, rate } = useToolRating(toolId);
  const accent =
    color ??
    (categoryId ? getCategoryAccentCssVar(categoryId) : undefined) ??
    getCategoryAccentColor("pdf");
  const style = { "--star-rating-color": accent } as CSSProperties;

  const countLabel =
    stats.count === 0
      ? t("noRatingsYet")
      : stats.count === 1
        ? t("ratingOne")
        : stats.count >= 1000
          ? t("ratingsCompact", { count: formatCompactRatingCount(stats.count) })
          : t("ratingsCount", { count: stats.count });

  if (!hydrated) {
    return (
      <span
        className={clsx(
          "tool-rating-summary",
          "tool-rating-summary--loading",
          className,
        )}
        style={style}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={clsx("tool-rating-summary", className)}
      style={style}
      onClick={(event) => {
        // Keep rating clicks from hitting the card overlay link.
        event.preventDefault();
        event.stopPropagation();
      }}
      aria-label={
        stats.average != null
          ? t("summaryAria", {
              average: formatRatingAverage(stats.average),
              countLabel,
            })
          : countLabel
      }
    >
      <StarRating
        value={userRating ?? 0}
        onChange={userRating == null ? rate : undefined}
        readOnly={userRating != null}
        size="sm"
        color={accent}
        label={
          userRating == null
            ? t("rateThisTool")
            : t("yourRatingAria", { rating: userRating })
        }
      />
      {stats.average != null ? (
        <span className="tool-rating-summary__average" dir="ltr">
          {formatRatingAverage(stats.average)}
        </span>
      ) : null}
      {userRating != null ? (
        <span className="tool-rating-summary__thanks" aria-live="polite">
          {t("thanks")}
        </span>
      ) : null}
      {showCount ? (
        <span className="tool-rating-summary__count">{countLabel}</span>
      ) : null}
    </span>
  );
}
