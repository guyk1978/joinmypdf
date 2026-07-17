import { getTranslations } from "next-intl/server";
import { CategoryHubsSection } from "@/components/CategoryHubsSection";
import "./hero.css";

/**
 * Homepage dashboard — category-first Industrial Matte grid (WattQuick-style).
 */
export async function Hero() {
  const t = await getTranslations("Home");

  return (
    <section className="hero hero--dashboard" aria-labelledby="hero-title">
      <div className="hero__container">
        <h1 id="hero-title" className="hero__title">
          {t("landing.heroTitle")}
        </h1>

        <CategoryHubsSection
          className="hero__categories"
          hideHead
          dense
          navLabel={t("landing.heroCategoriesLabel")}
        />
      </div>
    </section>
  );
}
