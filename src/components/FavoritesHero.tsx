import { getTranslations } from "next-intl/server";

export async function FavoritesHero() {
  const t = await getTranslations("Header");

  return (
    <section className="favorites-hero" aria-labelledby="favorites-page-title">
      <h1 id="favorites-page-title" className="favorites-hero__title">
        {t("favorites")}
      </h1>
    </section>
  );
}
