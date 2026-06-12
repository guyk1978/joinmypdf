import type { Metadata } from "next";
import type { ReactNode } from "react";
export const runtime = "edge";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { PrivacyFirstHero } from "@/components/PrivacyFirstHero";
import { ComparisonTable } from "@/components/ComparisonTable";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { JsonLd, faqLd } from "@/lib/schema";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { absoluteUrl } from "@/lib/site";
import { homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Globe, Lock, Shield } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

const COMPARISON_ROW_KEYS = ["processing", "upload", "storage", "privacy", "sensitive"] as const;
const USE_CASE_KEYS = ["financial", "medical", "legal", "personal"] as const;
const PRIVACY_TOOL_SLUGS = [
  "redact-pdf",
  "remove-hidden-metadata",
  "flatten-pdf",
  "safe-to-share-auditor",
  "protect-pdf",
  "compare-pdf",
] as const;
const FAQ_KEYS = ["upload", "verify", "policy"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyFirst" });
  const social = buildDefaultSocialImages(locale, { alt: t("metaTitle") });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/privacy-first` },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: absoluteUrl(`/${locale}/privacy-first`),
      ...social.openGraph,
    },
    twitter: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      ...social.twitter,
    },
  };
}

function TrustCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="privacy-glass-card flex h-full flex-col">
      <div className="privacy-glass-card__icon-wrap" aria-hidden>
        {icon}
      </div>
      <h3 className="privacy-glass-card__title">{title}</h3>
      <p className="privacy-glass-card__body">{children}</p>
    </article>
  );
}

export default async function PrivacyFirstPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PrivacyFirst");
  const tTools = await getTranslations("Tools");

  const faqs = FAQ_KEYS.map((key) => ({
    q: t(`faqs.${key}.q`),
    a: t(`faqs.${key}.a`),
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${t("title")} — JoinMyPDF`,
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/privacy-first`),
        }}
      />
      <JsonLd data={faqLd(faqs)} />
      <div className="home-page-shell min-h-screen text-neutral-900 dark:text-neutral-100">
        <HomePageSeamlessBg />
        <SiteHeader />
        <PrivacyFirstHero />
        <main className="privacy-first-content mx-auto w-full max-w-5xl px-4 py-12 md:px-8 md:py-16 lg:max-w-6xl">
          <div className="flex flex-col gap-14 md:gap-16">
            <section className="privacy-section privacy-section--center" aria-label={t("browseTools")}>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/tools/" className={homePrimaryPillBtn} prefetch={false}>
                  {t("browseTools")}
                </Link>
                <Link href="/privacy/" className={homeSecondaryPillBtn} prefetch={false}>
                  {t("privacyPolicy")}
                </Link>
              </div>
            </section>

            <section className="privacy-section" aria-labelledby="privacy-trust-pillars">
              <div className="grid gap-6 md:grid-cols-3">
                <TrustCard icon={<Lock className="h-6 w-6 text-emerald-400" />} title={t("trustLocalTitle")}>
                  {t("trustLocalBody")}
                </TrustCard>
                <TrustCard icon={<Shield className="h-6 w-6 text-emerald-400" />} title={t("trustMarketingTitle")}>
                  {t("trustMarketingBody")}
                </TrustCard>
                <TrustCard icon={<Globe className="h-6 w-6 text-emerald-400" />} title={t("trustVerifyTitle")}>
                  {t("trustVerifyBody")}
                </TrustCard>
              </div>
            </section>

            <section className="privacy-section privacy-glass-panel" aria-labelledby="how-it-works">
              <h2 id="how-it-works" className="privacy-section__title">
                {t("howTitle")}
              </h2>
              <div className="privacy-section__prose mt-6 space-y-4">
                <p>{t("howP1")}</p>
                <p>{t("howP2")}</p>
                <ol className="list-decimal space-y-3 ps-5">
                  <li>{t("howStep1")}</li>
                  <li>{t("howStep2")}</li>
                  <li>{t("howStep3")}</li>
                </ol>
              </div>
            </section>

            <section className="privacy-section privacy-glass-panel privacy-glass-panel--flush" aria-labelledby="comparison">
              <h2 id="comparison" className="privacy-section__title">
                {t("comparisonTitle")}
              </h2>
              <div className="privacy-comparison-table mt-8">
                <ComparisonTable
                  locale={locale}
                  flush
                  headers={{
                    topic: t("colTopic"),
                    typical: t("colTypical"),
                    join: t("colJoin"),
                  }}
                  rows={COMPARISON_ROW_KEYS.map((key) => ({
                    topic: t(`rows.${key}.topic`),
                    typical: t(`rows.${key}.typical`),
                    join: t(`rows.${key}.join`),
                  }))}
                />
              </div>
            </section>

            <section className="privacy-section" aria-labelledby="use-cases">
              <h2 id="use-cases" className="privacy-section__title">
                {t("useCasesTitle")}
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {USE_CASE_KEYS.map((key) => (
                  <article key={key} className="privacy-glass-card">
                    <h3 className="privacy-glass-card__title">{t(`useCases.${key}.title`)}</h3>
                    <p className="privacy-glass-card__body">{t(`useCases.${key}.body`)}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="privacy-section privacy-glass-panel" aria-labelledby="privacy-tools">
              <h2 id="privacy-tools" className="privacy-section__title">
                {t("toolsTitle")}
              </h2>
              <p className="privacy-section__prose mt-4">{t("toolsBody")}</p>
              <div className="mt-8">
                <CompactToolCardGrid
                  variant="glass"
                  className="gap-4 md:grid-cols-3 lg:grid-cols-3"
                  items={PRIVACY_TOOL_SLUGS.map((slug) => ({
                    href: `/tools/${slug}/`,
                    label: translateToolItem(tTools, slug, slug),
                    slugHint: slug,
                  }))}
                />
              </div>
              <p className="privacy-section__prose mt-8">
                {t("toolsDirectoryPrefix")}{" "}
                <Link href="/tools/" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                  {t("toolsDirectoryLink")}
                </Link>{" "}
                {t("toolsHubMiddle")}{" "}
                <Link
                  href="/privacy-first-pdf-tools/"
                  className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  {t("toolsHubLink")}
                </Link>
                .
              </p>
            </section>

            <section className="privacy-section privacy-glass-panel" aria-labelledby="privacy-faq">
              <h2 id="privacy-faq" className="privacy-section__title">
                {t("questions")}
              </h2>
              <div className="mt-8 flex flex-col gap-4">
                {faqs.map((f) => (
                  <details key={f.q} className="privacy-faq-item group">
                    <summary className="privacy-faq-item__summary">{f.q}</summary>
                    <p className="privacy-faq-item__body">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
