import { Shield, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function PrivacyFirstHero() {
  const t = await getTranslations("PrivacyFirst");

  return (
    <section className="privacy-first-hero" aria-labelledby="privacy-first-hero-title">
      <div className="privacy-first-hero__bg" aria-hidden="true">
        <div className="privacy-first-hero__mesh" />
        <div className="privacy-first-hero__grain" />
      </div>

      <div className="privacy-first-hero__content">
        <p className="privacy-first-hero__badge">
          <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
          {t("badge")}
        </p>

        <h1 id="privacy-first-hero-title" className="privacy-first-hero__title">
          {t("title")}
        </h1>

        <p className="privacy-first-hero__lead">{t("heroStrong")}</p>

        <p className="privacy-first-hero__subtitle">{t("heroBody")}</p>

        <div className="privacy-first-hero__meta">
          <span className="privacy-first-hero__pill">
            <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            {t("trustLocalTitle")}
          </span>
          <span className="privacy-first-hero__pill">
            <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            {t("trustVerifyTitle")}
          </span>
        </div>
      </div>
    </section>
  );
}
