"use client";

import { useTranslations } from "next-intl";
import { CompactToolCardGrid, type CompactToolCardItem } from "@/components/CompactToolCardGrid";
import { ctaSecondary } from "@/lib/cta-styles";
import { openToolsGrid } from "@/lib/tool-grid-events";

type FeaturedToolsShowcaseProps = {
  items: CompactToolCardItem[];
  toolCount: number;
};

export function FeaturedToolsShowcase({ items, toolCount }: FeaturedToolsShowcaseProps) {
  const t = useTranslations("Home");

  return (
    <section className="mt-20 space-y-4 md:mt-24" aria-labelledby="featured-tools">
      <div className="text-center md:text-left">
        <h2
          id="featured-tools"
          className="text-2xl font-semibold tracking-tight text-black dark:text-white md:text-3xl"
        >
          {t("featuredTools")}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-black dark:text-neutral-200 md:mx-0 md:text-base">
          {t("featuredToolsDescription")}
        </p>
      </div>

      <div className="mx-auto max-w-4xl">
        <CompactToolCardGrid items={items} className="lg:grid-cols-4" />
      </div>

      <div className="flex justify-center md:justify-start">
        <button type="button" className={ctaSecondary} onClick={openToolsGrid}>
          {t("viewAllTools", { count: toolCount })}
        </button>
      </div>
    </section>
  );
}
