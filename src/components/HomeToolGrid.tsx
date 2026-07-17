"use client";

import { useTranslations } from "next-intl";
import "@/styles/tools-grid.css";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { HomeSectionBar } from "@/components/HomeSectionBar";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import type { HomeFeaturedToolItem } from "@/lib/featured-tools";
import {
  buildHomeMoreToolsCategories,
  type HomeMoreToolsCategory,
} from "@/lib/home-more-tools";
import type { ToolGridItem } from "@/lib/tool-grid";

type CategoryBlockProps = {
  category: HomeMoreToolsCategory;
  title: string;
  viewAllLabel: string;
};

function toCardItems(
  items: { id: string; href: string; label: string }[],
): ToolGridItem[] {
  return items.map((item) => ({
    href: item.href,
    label: item.label,
    slugHint: item.id,
    description: getToolsInventoryEntry(item.id)?.description,
  }));
}

function CategoryBlock({ category, title, viewAllLabel }: CategoryBlockProps) {
  return (
    <section
      className="home-im-section home-category-block"
      aria-labelledby={`home-cat-${category.id}`}
    >
      <HomeSectionBar
        id={`home-cat-${category.id}`}
        as="h3"
        title={title}
        href={category.hubHref}
        ctaLabel={viewAllLabel}
      />
      <CategoryDirectoryFlatGrid
        className="home-im-grid"
        items={toCardItems(category.items)}
      />
    </section>
  );
}

type HomeToolGridProps = {
  pdfPowerhouseItems: HomeFeaturedToolItem[];
};

export function HomeToolGrid({ pdfPowerhouseItems }: HomeToolGridProps) {
  const t = useTranslations("Home");
  const categories = buildHomeMoreToolsCategories(t);

  const pdfItems: ToolGridItem[] = pdfPowerhouseItems.map((item) => ({
    href: item.href,
    label: item.label,
    slugHint: item.slugHint,
    description: getToolsInventoryEntry(item.slugHint)?.description,
  }));

  return (
    <>
      <section
        className="home-im-section home-pdf-powerhouse"
        aria-labelledby="home-pdf-powerhouse-title"
      >
        <HomeSectionBar
          id="home-pdf-powerhouse-title"
          title={t("landing.pdfTitle")}
          href="/tools/pdf-tools/"
          ctaLabel={t("viewAllPdfTools")}
        />
        <CategoryDirectoryFlatGrid className="home-im-grid" items={pdfItems} />
      </section>

      <section
        className="home-im-section home-more-tools"
        aria-labelledby="home-more-tools-title"
      >
        <HomeSectionBar
          id="home-more-tools-title"
          title={t("landing.moreTitle")}
        />
        <div className="home-more-tools__categories">
          {categories.map((category) => (
            <CategoryBlock
              key={category.id}
              category={category}
              title={t(category.titleKey)}
              viewAllLabel={t(category.viewAllLabelKey)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
