import { getTranslations } from "next-intl/server";

export async function ProjectsHero() {
  const t = await getTranslations("Projects");

  return (
    <section className="projects-hero" aria-labelledby="projects-page-title">
      <h1 id="projects-page-title" className="projects-hero__title">
        {t("title")}
      </h1>
      <p className="projects-hero__subtitle">{t("description")}</p>
    </section>
  );
}
