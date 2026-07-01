import type { MouseEvent, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";

export type ToolCardProps = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  actionSlot?: ReactNode;
  selected?: boolean;
  /** Accordion list item — exposes aria attrs on the button */
  accordionAria?: {
    expanded: boolean;
    controls: string;
  };
};

/**
 * Canonical tool list card — bg-gray-950 surface, border, hover, and label typography.
 * Used on the homepage, category directories, and favorites.
 */
export function ToolCard({
  label,
  icon,
  href,
  onClick,
  className,
  actionSlot,
  selected,
  accordionAria,
}: ToolCardProps) {
  const cardClassName = clsx("tool-card group", selected && "tool-card--selected", className);

  const body = (
    <>
      {actionSlot ? <div className="tool-card__action">{actionSlot}</div> : null}
      <span className="tool-card__icon" aria-hidden>
        {icon}
      </span>
      <span className="tool-card__label">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName} prefetch={false}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role={accordionAria ? "listitem" : undefined}
      className={cardClassName}
      onClick={onClick}
      aria-expanded={accordionAria?.expanded}
      aria-controls={accordionAria?.controls}
    >
      {body}
    </button>
  );
}
