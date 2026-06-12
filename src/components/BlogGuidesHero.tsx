import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function BlogGuidesHero() {
  const t = await getTranslations("Blog");

  return (
    <section className="guides-hero" aria-labelledby="guides-hero-title">
      <div className="guides-hero__bg" aria-hidden="true">
        <div className="guides-hero__mesh" />
        <div className="guides-hero__grain" />
      </div>

      <div className="guides-hero__content">
        <p className="guides-hero__badge">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-blue-400" aria-hidden />
          {t("badge")}
        </p>

        <h1 id="guides-hero-title" className="guides-hero__title">
          {t("title")}
        </h1>

        <p className="guides-hero__subtitle">{t("description")}</p>
      </div>
    </section>
  );
}
