"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { HomeHero } from "@/components/HomeHero";
import { HomeMarketingBanner } from "@/components/HomeMarketingBanner";
import { HomeToolAccordionGrid } from "@/components/HomeToolAccordionGrid";
import type { HomeGridToolItem } from "@/lib/featured-tools";

type HomeToolGridProps = {
  gridItems: HomeGridToolItem[];
  toolCount: number;
};

export function HomeToolGrid({ gridItems, toolCount }: HomeToolGridProps) {
  const t = useTranslations("Home");

  return (
    <>
      <HomeHero />

      <section className="home-focus-section" aria-labelledby="home-featured-tools">
        <h2 id="home-featured-tools" className="sr-only">
          {t("featuredTools")}
        </h2>

        <div className="home-split-layout">
          <div className="home-split-layout__tools">
            <HomeToolAccordionGrid items={gridItems} />
            <p className="home-focus-section__footer">
              <Link href="/tools/" className="home-focus-section__all-tools-link" prefetch={false}>
                {t("viewFullToolsList", { count: toolCount })}
              </Link>
            </p>
          </div>

          <HomeMarketingBanner />
        </div>
      </section>
    </>
  );
}
