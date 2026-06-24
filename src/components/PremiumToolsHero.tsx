import { getTranslations } from "next-intl/server";

export async function PremiumToolsHero() {
  const t = await getTranslations("PremiumTools");

  return (
    <section className="tools-directory-hero" aria-labelledby="premium-tools-title">
      <h1 id="premium-tools-title" className="tools-directory-hero__title">
        {t("title")}
      </h1>
    </section>
  );
}
