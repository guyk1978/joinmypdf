import { FolderKanban } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function ProjectsHero() {
  const t = await getTranslations("Projects");

  return (
    <section className="projects-hero" aria-labelledby="projects-page-title">
      <div className="projects-hero__bg" aria-hidden="true">
        <div className="projects-hero__mesh" />
        <div className="projects-hero__grain" />
      </div>

      <div className="projects-hero__content">
        <p className="projects-hero__badge">
          <FolderKanban className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden />
          {t("heroBadge")}
        </p>
        <h1 id="projects-page-title" className="projects-hero__title">
          {t("title")}
        </h1>
        <p className="projects-hero__subtitle">{t("description")}</p>
      </div>
    </section>
  );
}
