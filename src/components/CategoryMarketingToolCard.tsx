"use client";

import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getToolCardDescription,
  getToolCardHebrewDescription,
} from "@/data/tool-card-descriptions";
import { getToolListLucideIcon } from "@/lib/tool-list-icons";
import { getToolCardShortLabel } from "@/lib/tool-labels";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import "@/styles/category-hub-marketing.css";

type CategoryMarketingToolCardProps = {
  href: string;
  label: string;
  description?: string;
  slug?: string;
  categoryId?: InventoryCategoryId;
  className?: string;
};

function slugFromHref(href: string): string {
  const cleaned = href.split("?")[0]?.split("#")[0] ?? href;
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? cleaned;
}

/**
 * Premium category-hub tool card — icon, name, one-line blurb, hover launch cue.
 */
export function CategoryMarketingToolCard({
  href,
  label,
  description,
  slug,
  categoryId,
  className,
}: CategoryMarketingToolCardProps) {
  const locale = useLocale();
  const rawSlug = (slug || slugFromHref(href)).trim();
  const canonicalSlug = resolveCanonicalToolSlug(rawSlug);
  const displayLabel = getToolCardShortLabel(canonicalSlug, label);
  const catalogBlurb =
    locale === "he"
      ? getToolCardHebrewDescription(canonicalSlug)
      : getToolCardDescription(canonicalSlug);
  const blurb =
    description?.trim() ||
    catalogBlurb ||
    "Open this tool and process files locally in your browser.";
  const Icon = getToolListLucideIcon(canonicalSlug, displayLabel);

  return (
    <Link
      href={href}
      className={clsx("chm-tool-card", className)}
      prefetch={false}
      data-tool-slug={canonicalSlug}
      data-category={categoryId}
    >
      <span className="chm-tool-card__icon" aria-hidden>
        <Icon strokeWidth={1.5} />
      </span>
      <span className="chm-tool-card__body">
        <span className="chm-tool-card__title" lang={locale}>
          {displayLabel}
        </span>
        <span className="chm-tool-card__desc">{blurb}</span>
      </span>
      <span className="chm-tool-card__cta">
        Use Now
        <ArrowRight className="chm-tool-card__cta-icon" aria-hidden strokeWidth={2} />
      </span>
    </Link>
  );
}
