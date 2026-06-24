import { getTranslations } from "next-intl/server";

export async function ToolsDirectoryHero() {
  const t = await getTranslations("ToolsDirectory");

  return (
    <section className="tools-directory-hero" aria-labelledby="tools-directory-title">
      <h1 id="tools-directory-title" className="tools-directory-hero__title">
        {t("title")}
      </h1>
    </section>
  );
}
