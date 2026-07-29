"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { listHomeHeroTileTools } from "@/lib/home-hero-launch";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

type LaunchTile = {
  slug: string;
  title: string;
  href: string;
};

type HomeHeroLaunchProps = {
  locale: string;
};

/**
 * Homepage hero — framed Tools list (plain text links in two columns).
 * Each link routes directly to that tool’s page.
 */
export function HomeHeroLaunch({ locale }: HomeHeroLaunchProps) {
  const t = useTranslations("Home.landing");
  const tTools = useTranslations("Tools");
  const baseId = "home-hero-launch";

  const tiles = useMemo((): LaunchTile[] => {
    return listHomeHeroTileTools()
      .map((tool) => ({
        slug: tool.slug,
        title: resolveInventoryToolLabel(tool.slug, tTools),
        href: resolveToolHref(tool.slug, tool.primaryCategory, locale),
      }))
      .sort((a, b) => a.title.localeCompare(b.title, locale));
  }, [locale, tTools]);

  return (
    <section
      className="home-hero-launch"
      aria-labelledby={`${baseId}-title`}
    >
      <h2 id={`${baseId}-title`} className="home-hero-launch__title">
        {t("heroLaunchTitle")}
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
