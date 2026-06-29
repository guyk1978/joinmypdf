"use client";

import { useTranslations } from "next-intl";

export function HomeHero() {
  const t = useTranslations("Home");

  return (
    <section className="home-hero-industrial home-hero-industrial--centered" aria-labelledby="home-hero-title">
      <div className="home-hero-industrial__content">
        <h1 id="home-hero-title" className="sr-only">
          {t("headline")}
        </h1>
        <p className="home-hero-industrial__subtitle home-hero-industrial__subtitle--prominent">
          {t("subHeader")}
        </p>
      </div>
    </section>
  );
}
