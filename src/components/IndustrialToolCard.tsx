"use client";

import type { MouseEvent, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useOptionalToolModal } from "@/components/tool-modal/ToolModalProvider";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";

export type IndustrialToolCardProps = {
  href: string;
  label: string;
  description?: string;
  icon: ReactNode;
  className?: string;
  /** Tool slug for modal catalog (defaults to last path segment of href). */
  slug?: string;
  /** When false, always navigate (skip modal). Default true. */
  openInModal?: boolean;
};

function slugFromHref(href: string): string {
  const cleaned = href.split("?")[0]?.split("#")[0] ?? href;
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? cleaned;
}

/**
 * Industrial Matte tool card — bordered dark tile with green hover accent.
 * Click opens ToolModalWrapper when a ToolModalProvider is present.
 */
export function IndustrialToolCard({
  href,
  label,
  description,
  icon,
  className,
  slug,
  openInModal = true,
}: IndustrialToolCardProps) {
  const modal = useOptionalToolModal();
  const embed = useToolEmbedMode();
  const toolSlug = slug ?? slugFromHref(href);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!openInModal || !modal || embed) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    event.preventDefault();
    modal.openToolModal({
      slug: toolSlug,
      href,
      title: label,
      description,
    });
  };

  return (
    <Link
      href={href}
      className={clsx("im-tool-card", className)}
      prefetch={false}
      data-tool-modal-open={openInModal && modal && !embed ? "" : undefined}
      onClick={handleClick}
    >
      <span className="im-tool-card__icon" aria-hidden>
        {icon}
      </span>
      <span className="im-tool-card__body">
        <span className="im-tool-card__title">{label}</span>
        {description ? <span className="im-tool-card__description">{description}</span> : null}
      </span>
    </Link>
  );
}
