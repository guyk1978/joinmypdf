"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function HomeHero() {
  const t = useTranslations("Home");

  return (
    <section className="home-hero-industrial" aria-labelledby="home-hero-title">
      <div className="home-hero-industrial__content">
        <h1 id="home-hero-title" className="home-hero-industrial__title">
          <span className="home-hero-industrial__title-inner">
            {t("headline")}
            <Link
              href="/privacy-first/"
              className="home-hero-industrial__privacy-link"
              prefetch={false}
              aria-label={t("privacyBadge")}
              title={t("privacyBadge")}
            >
              <Shield className="home-hero-industrial__privacy-icon" aria-hidden />
            </Link>
          </span>
        </h1>

        <p className="home-hero-industrial__subtitle">{t("subHeader")}</p>
      </div>
    </section>
  );
}
