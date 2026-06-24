import { getTranslations } from "next-intl/server";

export async function BlogGuidesHero() {
  const t = await getTranslations("Blog");

  return (
    <section className="guides-hero" aria-labelledby="guides-hero-title">
      <h1 id="guides-hero-title" className="guides-hero__title">
        {t("metaTitle")}
      </h1>
    </section>
  );
}
