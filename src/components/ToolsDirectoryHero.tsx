import { Shield, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type ToolsDirectoryHeroProps = {
  toolCount: number;
};

export async function ToolsDirectoryHero({ toolCount }: ToolsDirectoryHeroProps) {
  const t = await getTranslations("ToolsDirectory");

  return (
    <section className="tools-directory-hero" aria-labelledby="tools-directory-title">
      <div className="tools-directory-hero__bg" aria-hidden="true">
        <div className="tools-directory-hero__mesh" />
        <div className="tools-directory-hero__grain" />
      </div>

      <div className="tools-directory-hero__content">
        <p className="tools-directory-hero__badge">{t("badge")}</p>

        <h1 id="tools-directory-title" className="tools-directory-hero__title">
          {t("title")}
        </h1>

        <p className="tools-directory-hero__subtitle">{t("description", { count: toolCount })}</p>

        <div className="tools-directory-hero__meta">
          <span className="tools-directory-hero__pill">
            <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            {t("clientSide")}
          </span>
          <Link href="/privacy-first/" className="tools-directory-hero__pill tools-directory-hero__pill--link">
            <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            {t("privacyFirst")}
          </Link>
        </div>
      </div>
    </section>
  );
}
