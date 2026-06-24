import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function FavoritesHero() {
  const t = await getTranslations("Favorites");

  return (
    <section className="favorites-hero" aria-labelledby="favorites-page-title">
      <div className="favorites-hero__bg" aria-hidden="true">
        <div className="favorites-hero__mesh" />
        <div className="favorites-hero__grain" />
      </div>

      <div className="favorites-hero__content">
        <p className="favorites-hero__badge">
          <Star className="h-3.5 w-3.5 shrink-0 fill-neutral-400/90 text-neutral-400" aria-hidden />
          {t("heroBadge")}
        </p>
        <h1 id="favorites-page-title" className="favorites-hero__title">
          {t("title")}
        </h1>
        <p className="favorites-hero__subtitle">{t("description")}</p>
      </div>
    </section>
  );
}
