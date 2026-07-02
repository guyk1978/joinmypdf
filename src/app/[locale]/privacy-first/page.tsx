import type { Metadata } from "next";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { ComparisonTable } from "@/components/ComparisonTable";
import { AppPageShell } from "@/components/AppPageShell";
import { Link } from "@/i18n/navigation";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { getBrandName } from "@/lib/brand";
import { JsonLd, faqLd } from "@/lib/schema";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { absoluteUrl } from "@/lib/site";
import { contentDashboardPanel, homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";
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
    <article className={clsx(contentDashboardPanel, "flex h-full flex-col !p-6 md:!p-8")}>
      <div className="mb-4" aria-hidden>
        {icon}
      </div>
      <h3 className="privacy-section__title text-lg">{title}</h3>
      <p className="privacy-section__prose mt-3">{children}</p>
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
          name: `${t("title")} — ${getBrandName(locale)}`,
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/privacy-first`),
        }}
      />
      <JsonLd data={faqLd(faqs)} />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{t("title")}</h1>
          <div className="flex flex-col gap-10 md:gap-12">
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
                <TrustCard icon={<Lock className="h-6 w-6 text-neutral-400" />} title={t("trustLocalTitle")}>
                  {t("trustLocalBody")}
                </TrustCard>
                <TrustCard icon={<Shield className="h-6 w-6 text-neutral-400" />} title={t("trustMarketingTitle")}>
                  {t("trustMarketingBody")}
                </TrustCard>
                <TrustCard icon={<Globe className="h-6 w-6 text-neutral-400" />} title={t("trustVerifyTitle")}>
                  {t("trustVerifyBody")}
                </TrustCard>
              </div>
            </section>

            <section className={clsx(contentDashboardPanel, "privacy-section")} aria-labelledby="how-it-works">
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

            <section className={clsx(contentDashboardPanel, "privacy-section !pb-0")} aria-labelledby="comparison">
              <h2 id="comparison" className="privacy-section__title">
                {t("comparisonTitle")}
              </h2>
              <div className="mt-8 overflow-x-auto">
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
                  <article key={key} className={clsx(contentDashboardPanel, "!p-6 md:!p-8")}>
                    <h3 className="privacy-section__title text-lg">{t(`useCases.${key}.title`)}</h3>
                    <p className="privacy-section__prose mt-3">{t(`useCases.${key}.body`)}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={clsx(contentDashboardPanel, "privacy-section")} aria-labelledby="privacy-tools">
              <h2 id="privacy-tools" className="privacy-section__title">
                {t("toolsTitle")}
              </h2>
              <p className="privacy-section__prose mt-4">{t("toolsBody")}</p>
              <div className="mt-8">
                <CompactToolCardGrid
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
                <Link href="/tools/" className="font-semibold text-neutral-600 hover:underline dark:text-neutral-400">
                  {t("toolsDirectoryLink")}
                </Link>{" "}
                {t("toolsHubMiddle")}{" "}
                <Link
                  href="/privacy-first-pdf-tools/"
                  className="font-semibold text-neutral-600 hover:underline dark:text-neutral-400"
                >
                  {t("toolsHubLink")}
                </Link>
                .
              </p>
            </section>

            <section className={clsx(contentDashboardPanel, "privacy-section")} aria-labelledby="privacy-faq">
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
        </div>
      </AppPageShell>
    </>
  );
}
