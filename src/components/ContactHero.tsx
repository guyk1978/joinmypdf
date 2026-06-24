import { getTranslations } from "next-intl/server";

export async function ContactHero() {
  const t = await getTranslations("Contact");

  return (
    <section className="contact-hero" aria-labelledby="contact-page-title">
      <h1 id="contact-page-title" className="contact-hero__title">
        {t("title")}
      </h1>
      <p className="contact-hero__subtitle">{t("intro")}</p>
    </section>
  );
}
