import { Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function PrivacyPolicyHero() {
  const t = await getTranslations("Privacy");

  return (
    <section className="privacy-policy-hero" aria-labelledby="privacy-policy-title">
      <div className="privacy-policy-hero__bg" aria-hidden="true">
        <div className="privacy-policy-hero__mesh" />
        <div className="privacy-policy-hero__grain" />
      </div>

      <div className="privacy-policy-hero__content">
        <p className="privacy-policy-hero__badge">
          <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
          {t("heroBadge")}
        </p>
        <h1 id="privacy-policy-title" className="privacy-policy-hero__title">
          {t("title")}
        </h1>
        <p className="privacy-policy-hero__subtitle">{t("intro")}</p>
      </div>
    </section>
  );
}
