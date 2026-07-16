import { getTranslations } from "next-intl/server";
import { Lock, ServerOff, Zap } from "lucide-react";
import { HeroAnimation } from "@/components/HeroAnimation";
import "./hero.css";

const TRUST_CHIPS = [
  { key: "heroFast", Icon: Zap },
  { key: "heroLocal", Icon: ServerOff },
  { key: "heroPrivate", Icon: Lock },
] as const;

/** Standalone homepage hero — styles live in ./hero.css only. */
export async function Hero() {
  const t = await getTranslations("Home");

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__container">
        <div className="hero__split">
          <div className="hero__copy">
            <p className="hero__badge">
              <span className="hero__badge-dot" aria-hidden />
              {t("landing.heroBadge")}
            </p>

            <h1 id="hero-title" className="hero__title">
              {t("landing.heroTitle")}
            </h1>

            <p className="hero__subtitle">{t("landing.heroSubtitle")}</p>

            <ul className="hero__chips" aria-label={t("trustSignalsLabel")}>
              {TRUST_CHIPS.map(({ key, Icon }) => (
                <li key={key} className="hero__chip">
                  <Icon className="hero__chip-icon" aria-hidden strokeWidth={1.5} />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="hero__visual">
            <HeroAnimation />
          </div>
        </div>
      </div>
    </section>
  );
}
