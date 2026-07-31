"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToolCardFocus } from "@/components/ToolCardFocus";
import { ToolPinButton } from "@/components/ToolPinButton";
import { useToolsDirectorySelection } from "@/components/ToolsDirectorySelectionContext";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentCssVar,
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import { getToolCardShortLabel } from "@/lib/tool-labels";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolRealWorldExampleByLocale } from "@/data/tool-real-world-examples-localized";

export type IndustrialToolCardProps = {
  href: string;
  label: string;
  description?: string;
  icon: ReactNode;
  className?: string;
  /** Tool slug for modal catalog (defaults to last path segment of href). */
  slug?: string;
  /** Parent category context — drives close-navigation target. */
  categoryId?: InventoryCategoryId;
  /** Category hub to restore when the tool modal closes. */
  returnHref?: string;
  /**
   * @deprecated Go always opens the tool page in a new tab.
   * Kept for call-site compatibility.
   */
  openInModal?: boolean;
  /**
   * `tool-modal` — Expand opens focus popup; Go opens tool in a new tab.
   * `focus` — Expand / programmatic focus popup (homepage sections).
   */
  interactionMode?: "tool-modal" | "focus";
  /**
   * @deprecated Compact cards always show the action row; kept for call-site compatibility.
   */
  coverOnly?: boolean;
};

function slugFromHref(href: string): string {
  const cleaned = href.split("?")[0]?.split("#")[0] ?? href;
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? cleaned;
}

/**
 * Compact Industrial Matte tool card:
 * category accent strip → short name → expand / pin / go icon row.
 */
export function IndustrialToolCard({
  href,
  label,
  description,
  icon,
  className,
  slug,
  categoryId: categoryIdProp,
  interactionMode = "tool-modal",
}: IndustrialToolCardProps) {
  const locale = useLocale();
  const tCard = useTranslations("ToolCard");
  const tDirectory = useTranslations("ToolsDirectory");
  const [focusOpen, setFocusOpen] = useState(false);
  const toolSlug = resolveCanonicalToolSlug(slug ?? slugFromHref(href));
  const shortLabel = getToolCardShortLabel(toolSlug, label);
  /** Hub context for modal close / return navigation. */
  const categoryId = resolveToolCategoryId(toolSlug, categoryIdProp);
  /** Per-tool accent so covers stay distinct across a shared hub grid. */
  const accentCategoryId =
    resolveToolAccentCategoryId(toolSlug, categoryId) ?? categoryId ?? "pdf";
  const nestedHref = categoryId ? resolveToolHref(toolSlug, categoryId, locale) : href;
  const accentStyle = {
    "--category-accent": getCategoryAccentCssVar(accentCategoryId),
  } as CSSProperties;
  const focusInteraction = interactionMode === "focus";
  const selection = useToolsDirectorySelection();
  const selected = selection?.isSelected(toolSlug) ?? false;

  const exampleKey = `examples.${toolSlug}`;
  const example = tCard.has(exampleKey)
    ? tCard(exampleKey)
    : getToolRealWorldExampleByLocale(toolSlug, locale);

  return (
    <div
      className={clsx(
        "im-tool-card",
        selection && "im-tool-card--selectable",
        selected && "im-tool-card--selected",
        className,
      )}
      data-category={accentCategoryId}
      style={accentStyle}
    >
      {selection ? (
        <label className="im-tool-card__select">
          <input
            type="checkbox"
            className="im-tool-card__select-input"
            checked={selected}
            onChange={() => selection.toggle(toolSlug)}
            aria-label={tDirectory("selectForFavoritesAria", { label: shortLabel })}
          />
          <span className="im-tool-card__select-box" aria-hidden />
        </label>
      ) : null}
      <span className="im-tool-card__dot" aria-hidden />
      <span className="im-tool-card__title">{shortLabel}</span>

      <div className="im-tool-card__actions" role="group" aria-label={shortLabel}>
        <ToolCardFocus
          slug={toolSlug}
          href={nestedHref}
          label={shortLabel}
          description={description}
          example={example}
          icon={icon}
          categoryId={accentCategoryId}
          open={focusInteraction ? focusOpen : undefined}
          onOpenChange={focusInteraction ? setFocusOpen : undefined}
          showExpandButton
          className="im-tool-card__action im-tool-card__expand"
        />

        <ToolPinButton
          toolId={toolSlug}
          variant="card"
          className="im-tool-card__action im-tool-card__pin"
        />

        <Link
          href={nestedHref}
          className="im-tool-card__action im-tool-card__go"
          prefetch={false}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={tCard("goAria", { label: shortLabel })}
          title={tCard("goAria", { label: shortLabel })}
        >
          <ArrowRight size={16} strokeWidth={2.4} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
