"use client";

import type { ReactNode } from "react";
import {
  MinimalToolCard,
  type MinimalToolCardProps,
} from "@/components/MinimalToolCard";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

export type IndustrialToolCardProps = {
  href: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  slug?: string;
  categoryId?: InventoryCategoryId;
  returnHref?: string;
  openInModal?: boolean;
  interactionMode?: "tool-modal" | "focus";
  coverOnly?: boolean;
  hidePin?: boolean;
  favoritesRemove?: boolean;
  hideSelect?: boolean;
};

/**
 * Global tool card — ultra-minimal chrome (accent stripe + title + maximize).
 * Props kept for call-site compatibility; unused chrome (checkbox, START, icons,
 * descriptions) is intentionally omitted.
 */
export function IndustrialToolCard({
  href,
  label,
  description,
  icon,
  className,
  slug,
  categoryId,
  interactionMode = "tool-modal",
  favoritesRemove = false,
}: IndustrialToolCardProps) {
  return (
    <MinimalToolCard
      href={href}
      label={label}
      description={description}
      icon={icon}
      className={className}
      slug={slug}
      categoryId={categoryId}
      interactionMode={interactionMode}
      favoritesRemove={favoritesRemove}
    />
  );
}

export { MinimalToolCard, type MinimalToolCardProps };
export { IndustrialToolCard as ToolCard };
export type { IndustrialToolCardProps as ToolCardProps };
