import { getTranslations } from "next-intl/server";

export async function PrivacyFirstHero() {
  const t = await getTranslations("PrivacyFirst");

  return (
    <section className="privacy-first-hero" aria-labelledby="privacy-first-hero-title">
      <h1 id="privacy-first-hero-title" className="privacy-first-hero__title">
        {t("title")}
      </h1>
      <p className="privacy-first-hero__subtitle">{t("heroStrong")}</p>
    </section>
  );
}
