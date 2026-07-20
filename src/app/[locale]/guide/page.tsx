import type { Metadata } from "next";
import { AppPageShell } from "@/components/AppPageShell";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { Link } from "@/i18n/navigation";
import { getBrandName } from "@/lib/brand";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Bookmark, LayoutGrid, ShieldCheck, Star } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

const SECTIONS = [
  { key: "privacy", icon: ShieldCheck, accent: "#22c55e", bullets: ["b1", "b2"] as const },
  { key: "tools", icon: LayoutGrid, accent: "#3b82f6", bullets: ["b1", "b2", "b3"] as const },
  { key: "library", icon: Bookmark, accent: "#f59e0b", bullets: ["b1", "b2", "b3"] as const },
  { key: "ratings", icon: Star, accent: "#8b5cf6", bullets: ["b1"] as const },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Guide" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/guide` },
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Guide");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${t("title")} — ${getBrandName(locale)}`,
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/guide`),
        }}
      />

      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("description")} variant="document">
          <div className="guide-page product-page-document-stack">
            <div className="guide-page-grid">
              {SECTIONS.map(({ key, icon: Icon, accent, bullets }) => (
                <section
                  key={key}
                  className="guide-page-card"
                  aria-labelledby={`guide-section-${key}`}
                >
                  <div className="guide-page-card__header">
                    <span
                      className="guide-page-card__icon-wrap"
                      style={{ color: accent, borderColor: `${accent}33`, backgroundColor: `${accent}14` }}
                      aria-hidden
                    >
                      <Icon className="guide-page-card__icon" />
                    </span>
                    <h2 id={`guide-section-${key}`} className="guide-page-card__title">
                      {t(`sections.${key}.title`)}
                    </h2>
                  </div>

                  <ul className="guide-page-bullets">
                    {bullets.map((bulletKey) => (
                      <li key={bulletKey} className="guide-page-bullet">
                        <strong className="guide-page-bullet__label">
                          {t(`sections.${key}.bullets.${bulletKey}.label`)}
                        </strong>
                        <span className="guide-page-bullet__text">
                          {t(`sections.${key}.bullets.${bulletKey}.text`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <nav
              className="guide-page-nav"
              aria-label={t("relatedLabel")}
            >
              <Link
                href="/tools/"
                className="home-minimal-section__link text-base font-semibold"
                prefetch={false}
              >
                {t("backToTools")}
              </Link>
              <span className="text-[#525252]" aria-hidden>
                ·
              </span>
              <Link
                href="/privacy-first/"
                className="home-minimal-section__link text-base font-semibold"
                prefetch={false}
              >
                {t("learnPrivacy")}
              </Link>
            </nav>
          </div>

          <FeedbackWidget pageType="article" pageTitle={t("title")} />
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
