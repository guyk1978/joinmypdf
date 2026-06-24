import { getTranslations } from "next-intl/server";

export async function PrivacyPolicyHero() {
  const t = await getTranslations("Privacy");

  return (
    <section className="privacy-policy-hero" aria-labelledby="privacy-policy-title">
      <h1 id="privacy-policy-title" className="privacy-policy-hero__title">
        {t("title")}
      </h1>
      <p className="privacy-policy-hero__subtitle">{t("intro")}</p>
    </section>
  );
}
