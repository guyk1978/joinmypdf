"use client";

import { Shield, Zap, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function HomeHero() {
  const t = useTranslations("Home");

  return (
    <section className="home-hero-industrial" aria-labelledby="home-hero-title">
      <div className="home-hero-industrial__bg" aria-hidden="true">
        <div className="home-hero-industrial__mesh" />
        <div className="home-hero-industrial__grain" />
      </div>

      <div className="home-hero-industrial__content">
        <Link
          href="/privacy-first/"
          className="home-hero-industrial__badge group"
          prefetch={false}
        >
          <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
          <span>{t("privacyBadge")}</span>
        </Link>

        <h1 id="home-hero-title" className="home-hero-industrial__title">
          {t("headline")}
        </h1>

        <p className="home-hero-industrial__subtitle">{t("subHeader")}</p>

        <ul className="home-hero-industrial__pills" aria-label={t("heroFeaturesLabel")}>
          <li className="home-hero-industrial__pill">
            <Zap className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            <span>{t("heroFast")}</span>
          </li>
          <li className="home-hero-industrial__pill">
            <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            <span>{t("heroLocal")}</span>
          </li>
          <li className="home-hero-industrial__pill">
            <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            <span>{t("heroPrivate")}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
