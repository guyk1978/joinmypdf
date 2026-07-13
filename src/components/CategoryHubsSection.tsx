"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { listDedicatedInventoryHubLinks } from "@/lib/tools-inventory-query";

type CategoryHubsSectionProps = {
  /** Extra classes on the outer section (e.g. shell padding). */
  className?: string;
};

/**
 * Shared inventory hubs grid — category names only, left-aligned.
 * Used sitewide via FooterToolsPanel (including the homepage).
 */
export function CategoryHubsSection({ className }: CategoryHubsSectionProps) {
  const t = useTranslations("Home");
  const categories = useMemo(() => listDedicatedInventoryHubLinks(), []);

  if (!categories.length) return null;

  return (
    <section
      className={["category-hubs text-left", className].filter(Boolean).join(" ")}
      aria-labelledby="category-hubs-title"
    >
      <div className="category-hubs__head">
        <p className="category-hubs__eyebrow">{t("landing.categoriesEyebrow")}</p>
        <h2 id="category-hubs-title" className="category-hubs__title">
          {t("landing.categoriesTitle")}
        </h2>
      </div>

      <nav aria-label={t("landing.heroCategoriesLabel")}>
        <ul className="category-hubs__grid flex flex-wrap justify-start gap-4 text-left">
          {categories.map((category) => (
            <li key={category.id}>
              <Link href={category.href} className="category-hubs__link" prefetch={false}>
                {category.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
