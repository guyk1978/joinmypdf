"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import { getToolRating } from "@/lib/tool-rating";

type ToolModalRatingProps = {
  /** Tool id — seeds the displayed score/count and keys localStorage. */
  slug?: string;
  labels?: {
    ratings?: string;
    thankYou?: string;
    rateAria?: string;
  };
  className?: string;
};

const STORAGE_PREFIX = "jmp-tool-rating:";

function StarIcon({ fill }: { fill: number }) {
  const clamped = Math.max(0, Math.min(1, fill));
  return (
    <span className="tool-modal-rating__star" aria-hidden>
      <svg viewBox="0 0 20 20" className="tool-modal-rating__star-base">
        <path d="M10 1.6l2.47 5.26 5.53.7-4.06 4-1.06 5.74L10 14.5l-4.88 2.8-1.06-5.74-4.06-4 5.53-.7z" />
      </svg>
      <span
        className="tool-modal-rating__star-fill"
        style={{ width: `${clamped * 100}%` }}
      >
        <svg viewBox="0 0 20 20">
          <path d="M10 1.6l2.47 5.26 5.53.7-4.06 4-1.06 5.74L10 14.5l-4.88 2.8-1.06-5.74-4.06-4 5.53-.7z" />
        </svg>
      </span>
    </span>
  );
}

export function ToolModalRating({ slug, labels, className }: ToolModalRatingProps) {
  const locale = useLocale();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  const { score: baseScore, count: baseCount } = useMemo(
    () => getToolRating(slug),
    [slug],
  );

  useEffect(() => {
    if (!slug) return;
    try {
      const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
      if (stored) setUserRating(Number(stored));
    } catch {
      // Private mode / storage blocked — rating simply stays session-only.
    }
  }, [slug]);

  const rated = userRating !== null;
  const count = baseCount + (rated ? 1 : 0);
  const displayScore = hovered !== null ? hovered : rated ? userRating : baseScore;

  const countLabel = useMemo(() => {
    const formatted = new Intl.NumberFormat(locale).format(count);
    return (labels?.ratings ?? "{count} ratings").replace("{count}", formatted);
  }, [count, labels?.ratings, locale]);

  const scoreLabel = (rated ? userRating : baseScore).toFixed(1);

  const rate = (value: number) => {
    setUserRating(value);
    setShowThanks(true);
    if (slug) {
      try {
        window.localStorage.setItem(`${STORAGE_PREFIX}${slug}`, String(value));
      } catch {
        // Ignore storage failures; the in-memory state still updates.
      }
    }
    window.setTimeout(() => setShowThanks(false), 2400);
  };

  return (
    <div
      className={clsx(
        "tool-modal-rating",
        rated && "tool-modal-rating--rated",
        className,
      )}
    >
      <div
        className="tool-modal-rating__stars"
        role="radiogroup"
        aria-label={labels?.rateAria ?? "Rate this tool"}
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rated ? userRating === value : undefined}
            aria-label={`${value} / 5`}
            className="tool-modal-rating__star-btn"
            onMouseEnter={() => setHovered(value)}
            onFocus={() => setHovered(value)}
            onBlur={() => setHovered(null)}
            onClick={() => rate(value)}
          >
            <StarIcon fill={displayScore - (value - 1)} />
          </button>
        ))}
      </div>

      <span className="tool-modal-rating__label" aria-live="polite">
        {showThanks ? (
          <span className="tool-modal-rating__thanks">
            {labels?.thankYou ?? "Thank you!"}
          </span>
        ) : (
          <>
            <span className="tool-modal-rating__score">{scoreLabel}</span>
            <span className="tool-modal-rating__count">{countLabel}</span>
          </>
        )}
      </span>
    </div>
  );
}
