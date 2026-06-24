import { getTranslations } from "next-intl/server";

export async function CompareHero() {
  const t = await getTranslations("Compare");

  return (
    <section className="compare-hero" aria-labelledby="compare-page-title">
      <h1 id="compare-page-title" className="compare-hero__title">
        {t("title")}
      </h1>
      <p className="compare-hero__subtitle">{t("intro")}</p>
    </section>
  );
}
