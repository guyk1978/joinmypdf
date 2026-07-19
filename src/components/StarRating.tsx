"use client";

import type { CSSProperties } from "react";
import { Star } from "lucide-react";
import { clsx } from "clsx";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  /**
   * Category accent used for filled, outline, and hover stars.
   * Falls back to inherited `--star-rating-color` / `--category-accent`.
   */
  color?: string;
};

function clampRating(value: number): number {
  return Math.min(5, Math.max(0, value));
}

/**
 * Interactive (or read-only) 1–5 star control — ported from WattQuick.
 * Filled stars inherit the category accent so Editing/Conversion/etc. match
 * the tool icon color on the card.
 */
export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  label,
  className,
  color,
}: StarRatingProps) {
  const normalized = clampRating(value);
  const iconClass =
    size === "sm"
      ? "star-rating__icon star-rating__icon--sm"
      : size === "lg"
        ? "star-rating__icon star-rating__icon--lg"
        : "star-rating__icon";
  const interactive = !readOnly && onChange != null;
  const style = color
    ? ({ "--star-rating-color": color } as CSSProperties)
    : undefined;

  return (
    <div
      className={clsx("star-rating", interactive && "star-rating--interactive", className)}
      style={style}
      role={interactive ? "radiogroup" : "img"}
      aria-label={
        label ??
        (interactive
          ? "Rate this tool"
          : `${normalized.toFixed(1)} out of 5 stars`)
      }
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = normalized >= starValue;
        const partial = !filled && normalized > index && normalized < starValue;

        return (
          <span
            key={starValue}
            tabIndex={
              interactive &&
              (normalized === starValue || (normalized === 0 && starValue === 1))
                ? 0
                : -1
            }
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? normalized === starValue : undefined}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            onClick={
              interactive
                ? (event) => {
                    // Card ratings sit above an overlay link — never navigate.
                    event.preventDefault();
                    event.stopPropagation();
                    onChange?.(starValue);
                  }
                : undefined
            }
            onKeyDown={
              interactive
                ? (event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    event.stopPropagation();
                    onChange?.(starValue);
                  }
                : undefined
            }
            className={clsx(
              "star-rating__star",
              interactive && "star-rating__star--button",
              filled && "star-rating__star--filled",
              partial && "star-rating__star--partial",
            )}
          >
            <Star className={iconClass} strokeWidth={2} aria-hidden />
            {partial ? (
              <Star
                className={clsx(iconClass, "star-rating__icon--partial-fill")}
                strokeWidth={2}
                aria-hidden
                style={{
                  clipPath: `inset(0 ${100 - (normalized - index) * 100}% 0 0)`,
                }}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
