"use client";

import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useState } from "react";
import { clsx } from "clsx";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { StarRating } from "@/components/StarRating";
import { RateToolModal } from "@/components/RateToolModal";
import {
  EMPTY_TOOL_MODAL_ACTIONS,
  useOptionalToolModal,
} from "@/components/tool-modal/tool-modal-context";
import { useToolRating } from "@/hooks/useToolRating";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentColor,
  getCategoryAccentCssVar,
} from "@/lib/category-accent-colors";
import { formatRatingAverage, formatExactRatingCount } from "@/lib/tool-rating";
import { WORKSPACE_SET_TAB_EVENT, WORKSPACE_SET_TAB_MESSAGE } from "@/lib/workspace-flow";
import { requestToolModalTab } from "@/lib/tool-modal-tab-bus";

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
  /**
   * `accent` — full star control (legacy header).
   * `onDark` — full star control on dark surfaces.
   * `banner` — compact score chip inside the title banner (opens Reviews).
   */
  variant?: "accent" | "onDark" | "banner";
};

/**
 * Tool header rating — interactive stars with live average/count updates.
 * Shares the once-per-tool localStorage map with Industrial Matte cards.
 */
export function ToolModalRating({
  slug,
  categoryId,
  labels,
  className,
  variant = "accent",
}: ToolModalRatingProps) {
  const tCard = useTranslations("ToolCard");
  const toolModal = useOptionalToolModal();
  const { userRating, stats, hydrated, rate } = useToolRating(slug);
  const [rateOpen, setRateOpen] = useState(false);
  const accent =
    (categoryId ? getCategoryAccentCssVar(categoryId) : undefined) ??
    getCategoryAccentColor("pdf");
  const starColor = variant === "onDark" || variant === "banner" ? "#ffffff" : accent;
  const style = { "--star-rating-color": starColor } as CSSProperties;

  const openReviewsTab = useCallback(() => {
    // Prefer parent modal when embedded — iframe context has isOpen=false.
    if (typeof window !== "undefined" && window.parent !== window) {
      try {
        window.parent.postMessage(
          { type: WORKSPACE_SET_TAB_MESSAGE, tab: "reviews" },
          "*",
        );
      } catch {
        /* ignore */
      }
    }

    requestToolModalTab("reviews");

    const liveSetTab = toolModal?.session?.setTab;
    const bridgeSetTab = toolModal?.actions?.setTab;
    if (typeof liveSetTab === "function") {
      liveSetTab("reviews");
    } else if (
      typeof bridgeSetTab === "function" &&
      bridgeSetTab !== EMPTY_TOOL_MODAL_ACTIONS.setTab &&
      toolModal?.isOpen
    ) {
      bridgeSetTab("reviews");
    }

    // Full-page tool shell (same window, no modal).
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_SET_TAB_EVENT, { detail: { tab: "reviews" } }),
    );
  }, [toolModal]);

  if (!slug || !hydrated) {
    return (
      <div
        className={clsx(
          "tool-modal-rating",
          "tool-modal-rating--loading",
          variant === "onDark" && "tool-modal-rating--on-dark",
          variant === "banner" && "tool-modal-rating--banner",
          className,
        )}
        style={style}
        aria-hidden
      />
    );
  }

  const exactCount = formatExactRatingCount(stats.count);

  const countLabel = labels?.ratings
    ? labels.ratings.replace("{count}", exactCount)
    : stats.count === 0
      ? tCard("noRatingsYet")
      : stats.count === 1
        ? tCard("ratingOne")
        : tCard("ratingsCount", { count: exactCount });

  const rateLabel =
    userRating == null
      ? (labels?.rateAria ?? tCard("rateThisTool"))
      : (labels?.yourRatingAria?.replace("{rating}", String(userRating)) ??
        tCard("yourRatingAria", { rating: userRating }));

  if (variant === "banner") {
    const openRate = (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setRateOpen(true);
    };

    return (
      <>
        <button
          type="button"
          className={clsx("tool-modal-rating", "tool-modal-rating--banner", className)}
          style={style}
          onClick={openRate}
          aria-label={`${rateLabel}. ${formatRatingAverage(stats.average)}, ${countLabel}`}
        >
          <Star
            className="tool-modal-rating__banner-star"
            size={14}
            strokeWidth={2.25}
            fill="currentColor"
            aria-hidden
          />
          <span className="tool-modal-rating__score" dir="ltr">
            {formatRatingAverage(stats.average)}
          </span>
          <span className="tool-modal-rating__count">{countLabel}</span>
        </button>
        <RateToolModal
          open={rateOpen}
          slug={slug}
          onClose={() => setRateOpen(false)}
          onOpenReviews={openReviewsTab}
        />
      </>
    );
  }

  return (
    <div
      className={clsx(
        "tool-modal-rating",
        userRating != null && "tool-modal-rating--rated",
        variant === "onDark" && "tool-modal-rating--on-dark",
        className,
      )}
      style={style}
    >
      <StarRating
        value={userRating ?? stats.average ?? 0}
        onChange={userRating == null ? rate : undefined}
        readOnly={userRating != null}
        size="md"
        color={starColor}
        label={rateLabel}
      />

      <span className="tool-modal-rating__label" aria-live="polite">
        <span className="tool-modal-rating__score" dir="ltr">
          {formatRatingAverage(stats.average)}
        </span>
        <span className="tool-modal-rating__count">{countLabel}</span>
        {userRating != null ? (
          <span className="tool-modal-rating__thanks">
            {labels?.thankYou ?? tCard("thanks")}
          </span>
        ) : null}
      </span>
    </div>
  );
}
