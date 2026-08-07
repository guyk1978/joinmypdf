import {
  FileText,
  Image as ImageIcon,
  Type,
  RefreshCw,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FaqAccordion } from "@/components/FaqAccordion";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { getGlobalSeedReviews } from "@/data/community-reviews";
import "@/styles/home-marketing.css";

const BENEFIT_IDS = ["security", "speed", "privacy"] as const;
const BENEFIT_ICONS = {
  security: Shield,
  speed: Zap,
  privacy: Lock,
} as const;

const CATEGORIES = [
  { id: "pdf", href: "/tools/pdf-tools/", icon: FileText, titleKey: "pdf" },
  { id: "image", href: "/tools/image-tools/", icon: ImageIcon, titleKey: "image" },
  { id: "text", href: "/tools/text-tools/", icon: Type, titleKey: "text" },
  { id: "convert", href: "/tools/convert-tools/", icon: RefreshCw, titleKey: "convert" },
] as const;

const FAQ_IDS = ["upload", "free", "pro", "install", "local"] as const;

function StarRow({ rating, label }: { rating: number; label: string }) {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="hm-stars" aria-label={label}>
      {"★".repeat(clamped)}
      <span className="hm-stars__empty" aria-hidden>
        {"★".repeat(5 - clamped)}
      </span>
    </span>
  );
}

/**
 * Long-form local-first marketing landing — replaces the homepage tool grids.
 */
export async function HomeMarketingLanding() {
  const t = await getTranslations("Home.marketingLanding");
  const tLanding = await getTranslations("Home.landing");
  const tDir = await getTranslations("ToolsDirectory");

  const testimonials = getGlobalSeedReviews()
    .filter((review) => /fast|speed|ad|local|upload|queue/i.test(review.comment))
    .slice(0, 3);

  const fallbackTestimonials =
    testimonials.length >= 3
      ? testimonials
      : getGlobalSeedReviews().slice(0, 3);

  const faqItems = FAQ_IDS.map((id) => ({
    q: t(`faq.${id}.q`),
    a: t(`faq.${id}.a`),
  }));

  return (
    <div className="hm-landing">
      <section className="hm-hero" aria-labelledby="hm-hero-brand">
        <div className="hm-hero__glow" aria-hidden />
        <div className="hm-hero__inner">
          <p id="hm-hero-brand" className="hm-hero__brand">
            JoinMyPDF
          </p>
          <h1 className="hm-hero__title">
            {t("heroTitle")}
            <span className="hm-hero__title-em"> {t("heroTitleEm")}</span>
          </h1>
          <p className="hm-hero__sub">{t("heroSubtitle")}</p>
          <div className="hm-hero__actions">
            <Link href="/tools/" className="hm-btn hm-btn--primary">
              {tLanding("heroPrimaryCta")}
              <ArrowRight className="hm-btn__icon" aria-hidden strokeWidth={2} />
            </Link>
            <Link href="/tools/pdf-tools/" className="hm-btn hm-btn--ghost">
              {t("getStarted")}
            </Link>
          </div>
          <ul className="hm-hero__pills" aria-label={t("benefitsLabel")}>
            <li>{t("pillLocal")}</li>
            <li>{t("pillNoUploads")}</li>
            <li>{t("pillNoAds")}</li>
          </ul>
        </div>
      </section>

      <section className="hm-section" aria-labelledby="hm-why-title">
        <HomeReveal>
          <div className="hm-section__head hm-section__head--center">
            <p className="hm-eyebrow">{t("whyEyebrow")}</p>
            <h2 id="hm-why-title" className="hm-section__title">
              {t("whyTitle")}
            </h2>
            <p className="hm-section__lead">{t("whyLead")}</p>
          </div>
        </HomeReveal>

        <div className="hm-zigzag">
          {BENEFIT_IDS.map((id, index) => {
            const Icon = BENEFIT_ICONS[id];
            const reverse = index % 2 === 1;
            return (
              <HomeReveal key={id}>
                <article
                  className={`hm-zigzag__row${reverse ? " hm-zigzag__row--reverse" : ""}`}
                >
                  <div className="hm-zigzag__copy">
                    <span className="hm-zigzag__icon" aria-hidden>
                      <Icon strokeWidth={1.5} />
                    </span>
                    <h3 className="hm-zigzag__title">{t(`benefits.${id}.title`)}</h3>
                    <p className="hm-zigzag__body">{t(`benefits.${id}.body`)}</p>
                  </div>
                  <div className="hm-zigzag__visual" aria-hidden>
                    <div className="hm-visual-card">
                      <Sparkles className="hm-visual-card__spark" strokeWidth={1.5} />
                      <p className="hm-visual-card__label">{t(`benefits.${id}.visualLabel`)}</p>
                      <p className="hm-visual-card__detail">{t(`benefits.${id}.visualDetail`)}</p>
                      <div className="hm-visual-card__bars">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                </article>
              </HomeReveal>
            );
          })}
        </div>
      </section>

      <section className="hm-section" aria-labelledby="hm-categories-title">
        <HomeReveal>
          <div className="hm-section__head hm-section__head--center">
            <p className="hm-eyebrow">{t("categoriesEyebrow")}</p>
            <h2 id="hm-categories-title" className="hm-section__title">
              {t("categoriesTitle")}
            </h2>
            <p className="hm-section__lead">{t("categoriesLead")}</p>
          </div>
        </HomeReveal>

        <HomeReveal>
          <ul className="hm-feature-grid">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <li key={category.id}>
                  <Link href={category.href} className="hm-feature-card">
                    <span className="hm-feature-card__icon" aria-hidden>
                      <Icon strokeWidth={1.5} />
                    </span>
                    <h3 className="hm-feature-card__title">
                      {tLanding(`categoryTitles.${category.titleKey}`)}
                    </h3>
                    <p className="hm-feature-card__body">{t(`categoryBodies.${category.id}`)}</p>
                    <span className="hm-feature-card__cta">
                      {tDir("openHub")}
                      <ArrowRight aria-hidden strokeWidth={2} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </HomeReveal>
      </section>

      <section className="hm-section" aria-labelledby="hm-social-title">
        <HomeReveal>
          <div className="hm-section__head hm-section__head--center">
            <p className="hm-eyebrow">{t("socialEyebrow")}</p>
            <h2 id="hm-social-title" className="hm-section__title">
              {t("socialTitle")}
            </h2>
          </div>
        </HomeReveal>

        <HomeReveal>
          <ul className="hm-testimonial-grid">
            {fallbackTestimonials.map((review) => (
              <li key={review.id} className="hm-testimonial">
                <StarRow
                  rating={review.rating}
                  label={t("starsAria", { rating: Math.round(review.rating) })}
                />
                <p className="hm-testimonial__quote">&ldquo;{review.comment}&rdquo;</p>
                <p className="hm-testimonial__author">{review.author}</p>
              </li>
            ))}
          </ul>
        </HomeReveal>

        <HomeReveal>
          <aside className="hm-creator" aria-labelledby="hm-creator-title">
            <p className="hm-eyebrow">{t("creatorEyebrow")}</p>
            <h3 id="hm-creator-title" className="hm-creator__title">
              {t("creatorTitle")}
            </h3>
            <p className="hm-creator__text">{t("creatorP1")}</p>
            <p className="hm-creator__text">{t("creatorP2")}</p>
          </aside>
        </HomeReveal>
      </section>

      <section className="hm-section hm-section--narrow" aria-labelledby="hm-faq-title">
        <HomeReveal>
          <div className="hm-section__head hm-section__head--center">
            <p className="hm-eyebrow">{t("faqEyebrow")}</p>
            <h2 id="hm-faq-title" className="hm-section__title">
              {t("faqTitle")}
            </h2>
          </div>
          <div className="hm-faq-shell">
            <FaqAccordion items={faqItems} />
          </div>
        </HomeReveal>
      </section>

      <section className="hm-final" aria-labelledby="hm-final-title">
        <HomeReveal>
          <div className="hm-final__banner">
            <h2 id="hm-final-title" className="hm-final__title">
              {t("finalTitle")}
            </h2>
            <p className="hm-final__sub">{t("finalSub")}</p>
            <div className="hm-hero__actions hm-final__actions">
              <Link href="/tools/" className="hm-btn hm-btn--primary hm-btn--on-banner">
                {tLanding("heroPrimaryCta")}
                <ArrowRight className="hm-btn__icon" aria-hidden strokeWidth={2} />
              </Link>
            </div>
          </div>
        </HomeReveal>
      </section>
    </div>
  );
}
