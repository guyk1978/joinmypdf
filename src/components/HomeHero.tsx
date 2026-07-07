import { ArrowRight, Lock, ServerOff, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeaderSearch } from "@/components/HeaderSearch";

const TRUST_CHIPS = [
  { key: "heroFast", Icon: Zap },
  { key: "heroLocal", Icon: ServerOff },
  { key: "heroPrivate", Icon: Lock },
] as const;

export async function HomeHero() {
  const t = await getTranslations("Home");

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__backdrop" aria-hidden />
      <div className="home-hero__inner">
        <p className="home-hero__badge">
          <span className="home-hero__badge-dot" aria-hidden />
          {t("landing.heroBadge")}
        </p>

        <h1 id="home-hero-title" className="home-hero__title">
          {t("landing.heroTitle")}
        </h1>

        <p className="home-hero__subtitle">{t("landing.heroSubtitle")}</p>

        <div className="home-hero__search">
          <HeaderSearch variant="inline" />
        </div>

        <div className="home-hero__actions">
          <Link href="/tools/" className="home-hero__cta" prefetch={false}>
            {t("landing.heroPrimaryCta")}
            <ArrowRight className="home-hero__cta-icon" aria-hidden />
          </Link>
        </div>

        <ul className="home-hero__chips" aria-label={t("trustSignalsLabel")}>
          {TRUST_CHIPS.map(({ key, Icon }) => (
            <li key={key} className="home-hero__chip">
              <Icon className="home-hero__chip-icon" aria-hidden strokeWidth={1.5} />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
