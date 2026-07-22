"use client";

import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { NUpPdfIntroMotion } from "@/components/NUpPdfIntroMotion";
import "./n-up-pdf-landing.css";

const FEATURES = [
  { id: "layouts", titleKey: "featureLayouts", icon: "layouts" },
  { id: "scaling", titleKey: "featureScaling", icon: "scaling" },
  { id: "organized", titleKey: "featureOrganized", icon: "organized" },
  { id: "print", titleKey: "featurePrint", icon: "print" },
] as const;

function FeatureIcon({ kind }: { kind: (typeof FEATURES)[number]["icon"] }) {
  if (kind === "layouts") {
    return (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect x="4" y="4" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="22" y="4" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="4" y="22" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="22" y="22" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }
  if (kind === "scaling") {
    return (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden>
        <path
          d="M8 16V8h8M32 16V8h-8M8 24v8h8M32 24v8h-8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="13" y="13" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }
  if (kind === "organized") {
    return (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect x="8" y="4" width="24" height="32" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <rect x="12" y="10" width="7" height="8" rx="0.75" stroke="currentColor" strokeWidth="1.4" />
        <rect x="21" y="10" width="7" height="8" rx="0.75" stroke="currentColor" strokeWidth="1.4" />
        <rect x="12" y="21" width="7" height="8" rx="0.75" stroke="currentColor" strokeWidth="1.4" />
        <rect x="21" y="21" width="7" height="8" rx="0.75" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M12 16h16v6H12v-6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10 22h20v8a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-8Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M14 12h12v4H14v-4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="25" r="1.25" fill="currentColor" />
    </svg>
  );
}

type NUpPdfLandingHeroProps = {
  className?: string;
  /** Enables Get Started CTA + animated intro motion. */
  interactive?: boolean;
  onStart?: () => void;
  headingAs?: "h1" | "h2";
};

/**
 * N-Up PDF intro / landing hero: headline + looping motion stage + CTA.
 */
export function NUpPdfLandingHero({
  className,
  interactive = false,
  onStart,
  headingAs = "h2",
}: NUpPdfLandingHeroProps) {
  const t = useTranslations("NUpPdfLanding");
  const Heading = headingAs;
  const start = () => onStart?.();

  return (
    <section
      className={clsx(
        "nup-landing",
        interactive && "nup-landing--interactive",
        interactive && "nup-landing--motion",
        className,
      )}
      aria-labelledby="nup-landing-title"
    >
      <div className="nup-landing__glow" aria-hidden />
      <div className="nup-landing__network" aria-hidden />

      <div className="nup-landing__inner">
        <header className="nup-landing__copy">
          <Heading id="nup-landing-title" className="nup-landing__title">
            <span className="nup-landing__title-brand">{t("brand")}</span>
            <span className="nup-landing__title-rest"> {t("titleRest")}</span>
          </Heading>
          <p className="nup-landing__subtitle">{t("subtitle")}</p>
        </header>

        <div className="nup-landing__motion-wrap" aria-hidden>
          <NUpPdfIntroMotion />
        </div>

        <ul className="nup-landing__features">
          {FEATURES.map((feature) => (
            <li key={feature.id} className="nup-landing__feature">
              <span className="nup-landing__feature-icon">
                <FeatureIcon kind={feature.icon} />
              </span>
              <span className="nup-landing__feature-title">{t(feature.titleKey)}</span>
            </li>
          ))}
        </ul>

        {interactive ? (
          <div className="nup-landing__actions">
            <button type="button" className="nup-landing__start" onClick={start}>
              <span>{t("getStarted")}</span>
              <ArrowRight
                className="nup-landing__start-icon"
                size={18}
                strokeWidth={2.25}
                aria-hidden
              />
            </button>
            <p className="nup-landing__hint">{t("getStartedHint")}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
