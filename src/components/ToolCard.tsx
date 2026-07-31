import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { clsx } from "clsx";
import { ToolCardGoLink } from "@/components/ToolCardGoLink";
import {
  getCategoryAccentCssVar,
  resolveToolAccentCategoryId,
} from "@/lib/category-accent-colors";

export type ToolCardProps = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  actionSlot?: ReactNode;
  selected?: boolean;
  /** Tool id used to resolve the category accent on the cover plate. */
  slug?: string;
  /** Accordion list item — exposes aria attrs on the button */
  accordionAria?: {
    expanded: boolean;
    controls: string;
  };
};

/**
 * Canonical tool list card — Minimalist Industrial.
 * Rests as a matte black plate with the tool name and a category accent line;
 * hover/focus fades the plate away to reveal icon, label, and action controls.
 */
export function ToolCard({
  label,
  icon,
  href,
  onClick,
  className,
  actionSlot,
  selected,
  slug,
  accordionAria,
}: ToolCardProps) {
  const cardClassName = clsx("tool-card group", selected && "tool-card--selected", className);
  const categoryId = resolveToolAccentCategoryId(slug);
  const accentStyle = categoryId
    ? ({ "--tool-card-accent": getCategoryAccentCssVar(categoryId) } as CSSProperties)
    : undefined;

  const body = (
    <>
      <span className="tool-card__reveal">
        {actionSlot ? <div className="tool-card__action">{actionSlot}</div> : null}
        <span className="tool-card__icon" aria-hidden>
          {icon}
        </span>
        <span className="tool-card__label">{label}</span>
      </span>

      {/* Resting plate — hidden from AT so the label underneath is announced once. */}
      <span className="tool-card__cover" aria-hidden>
        <span className="tool-card__cover-title">{label}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <ToolCardGoLink
        href={href}
        className={cardClassName}
        style={accentStyle}
        data-category={categoryId || undefined}
      >
        {body}
      </ToolCardGoLink>
    );
  }

  return (
    <button
      type="button"
      role={accordionAria ? "listitem" : undefined}
      className={cardClassName}
      style={accentStyle}
      data-category={categoryId || undefined}
      onClick={onClick}
      aria-expanded={accordionAria?.expanded}
      aria-controls={accordionAria?.controls}
    >
      {body}
    </button>
  );
}
