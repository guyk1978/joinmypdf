"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import "@/styles/tools-grid.css";
import { HomeFlatToolLink } from "@/components/HomeFlatToolLink";
import type { HomeFeaturedToolItem } from "@/lib/featured-tools";
import {
  buildHomeMoreToolsCategories,
  type HomeMoreToolsCategory,
} from "@/lib/home-more-tools";

type CategoryBlockProps = {
  category: HomeMoreToolsCategory;
  title: string;
  viewAllLabel: string;
};

function CategoryBlock({ category, title, viewAllLabel }: CategoryBlockProps) {
  return (
    <section className="home-category-block" aria-labelledby={`home-cat-${category.id}`}>
      <div className="home-category-block__head">
        <h3 id={`home-cat-${category.id}`} className="home-category-block__title">
          <Link
            href={category.hubHref}
            className="home-category-block__title-link"
            prefetch={false}
          >
            {title}
          </Link>
        </h3>
        <Link href={category.hubHref} className="home-category-block__all" prefetch={false}>
          {viewAllLabel}
          <ArrowRight className="home-category-block__all-icon" aria-hidden />
        </Link>
      </div>
      <ul className="tools-grid">
        {category.items.map((item) => (
          <li key={item.id}>
            <HomeFlatToolLink href={item.href} label={item.label} slugHint={item.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}

type HomeToolGridProps = {
  pdfPowerhouseItems: HomeFeaturedToolItem[];
};

export function HomeToolGrid({ pdfPowerhouseItems }: HomeToolGridProps) {
  const t = useTranslations("Home");
  const categories = buildHomeMoreToolsCategories(t);

  return (
    <>
      <section className="home-pdf-powerhouse" aria-labelledby="home-pdf-powerhouse-title">
        <div className="home-section-head home-section-head--pdf">
          <p className="home-section-head__eyebrow">{t("landing.pdfEyebrow")}</p>
          <h2 id="home-pdf-powerhouse-title" className="home-section-head__title">
            {t("landing.pdfTitle")}
          </h2>
          <p className="home-section-head__subtitle">{t("landing.pdfSubtitle")}</p>
        </div>

        <ul className="home-pdf-powerhouse__links">
          {pdfPowerhouseItems.map((item) => (
            <li key={item.slugHint}>
              <HomeFlatToolLink
                href={item.href}
                label={item.label}
                slugHint={item.slugHint}
              />
            </li>
          ))}
        </ul>

        <div className="home-pdf-powerhouse__footer">
          <Link href="/tools/pdf-tools/" className="home-pdf-powerhouse__all" prefetch={false}>
            {t("viewAllPdfTools")}
            <ArrowRight className="home-pdf-powerhouse__all-icon" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="home-more-tools" aria-labelledby="home-more-tools-title">
        <div className="home-section-head home-section-head--more-tools">
          <p className="home-section-head__eyebrow">{t("landing.moreEyebrow")}</p>
          <h2 id="home-more-tools-title" className="home-section-head__title">
            {t("landing.moreTitle")}
          </h2>
          <p className="home-section-head__subtitle">{t("landing.moreSubtitle")}</p>
        </div>

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
