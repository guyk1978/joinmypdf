"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  listHomeHeroTileTools,
  listHomeHeroTileToolsByCategory,
} from "@/lib/home-hero-launch";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

type LaunchTile = {
  slug: string;
  title: string;
  href: string;
};

type HomeHeroLaunchProps = {
  locale: string;
  /** When set, only list tools from this inventory category. */
  categoryId?: InventoryCategoryId;
  /** Override the framed list heading (defaults to Home.landing.heroLaunchTitle). */
  toolsTitle?: string;
};

/**
 * Framed Tools list (plain text links in two columns).
 * Used on the homepage (all tools) and category hubs (filtered).
 */
export function HomeHeroLaunch({ locale, categoryId, toolsTitle }: HomeHeroLaunchProps) {
  const t = useTranslations("Home.landing");
  const tTools = useTranslations("Tools");
  const baseId = categoryId ? `category-hero-launch-${categoryId}` : "home-hero-launch";
  const heading = toolsTitle ?? t("heroLaunchTitle");

  const tiles = useMemo((): LaunchTile[] => {
    const source = categoryId
      ? listHomeHeroTileToolsByCategory(categoryId)
      : listHomeHeroTileTools();
    return source
      .map((tool) => ({
        slug: tool.slug,
        title: resolveInventoryToolLabel(tool.slug, tTools),
        href: resolveToolHref(tool.slug, tool.primaryCategory, locale),
      }))
      .sort((a, b) => a.title.localeCompare(b.title, locale));
  }, [categoryId, locale, tTools]);

  if (!tiles.length) return null;

  return (
    <section
      className="home-hero-launch"
      aria-labelledby={`${baseId}-title`}
    >
      <h2 id={`${baseId}-title`} className="home-hero-launch__title">
        {heading}
      </h2>

      <div className="home-hero-launch__scroll">
        <div className="home-hero-launch__grid" role="list">
          {tiles.map((tool) => (
            <Link
              key={tool.slug}
              href={tool.href}
              className="home-hero-launch__tile"
              role="listitem"
              prefetch={false}
            >
              <span className="home-hero-launch__tile-label">{tool.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
