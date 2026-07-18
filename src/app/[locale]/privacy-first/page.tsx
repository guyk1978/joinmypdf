import type { Metadata } from "next";
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
import { contentDashboardPanel, homePrimaryPillBtn } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
const MANIFESTO_SECTIONS = ["device", "zeroUploads", "future"] as const;

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

export default async function PrivacyFirstPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PrivacyFirst");
  const tTools = await getTranslations("Tools");
  const brand = getBrandName(locale);
  const pageUrl = absoluteUrl(`/${locale}/privacy-first`);

  const faqs = FAQ_KEYS.map((key) => ({
    q: t(`faqs.${key}.q`),
    a: t(`faqs.${key}.a`),
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: t("title"),
          description: t("metaDescription"),
          url: pageUrl,
          inLanguage: locale,
          about: {
            "@type": "Thing",
            name: "Local-First software architecture",
            description: t("schemaAbout"),
          },
          mainEntity: {
            "@type": "Organization",
            name: brand,
            url: absoluteUrl(`/${locale}`),
            description: t("schemaOrgDescription"),
            knowsAbout: [
              "Local-first software",
              "Browser-side document processing",
              "Privacy-focused web utilities",
              "Zero-upload PDF tools",
            ],
            brand: {
              "@type": "Brand",
              name: brand,
            },
          },
          publisher: {
            "@type": "Organization",
            name: brand,
            url: absoluteUrl(`/${locale}`),
          },
        }}
      />
      <JsonLd data={faqLd(faqs)} />

      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory page-container">
          <h1 className="home-minimal-tagline">{t("title")}</h1>
          <p className="privacy-section__prose mx-auto mt-4 max-w-3xl text-center text-base leading-relaxed md:text-lg">
            {t("missionSummary")}
          </p>

          <div className="mt-10 flex flex-col gap-10 md:gap-12">
            {MANIFESTO_SECTIONS.map((section) => {
              const benefitKeys = ["b1", "b2", "b3", "b4"] as const;
              return (
                <section
                  key={section}
                  className={clsx(contentDashboardPanel, "privacy-section")}
                  aria-labelledby={`manifesto-${section}`}
                >
                  <h2 id={`manifesto-${section}`} className="privacy-section__title">
                    {t(`manifesto.${section}.title`)}
                  </h2>
                  <p className="privacy-section__prose mt-4">{t(`manifesto.${section}.body`)}</p>
                  <ul className="privacy-policy-summary mt-6">
                    {benefitKeys.map((key) => (
                      <li key={key}>
                        <strong>{t(`manifesto.${section}.benefits.${key}`)}</strong>
                      </li>
                    ))}
                  </ul>
                  {section === "device" ? (
                    <p className="privacy-section__prose mt-6 mb-0">
                      {t("manifesto.device.comparePrefix")}{" "}
                      <Link
                        href="/compare/"
                        className="font-semibold text-neutral-600 hover:underline dark:text-neutral-400"
                        prefetch={false}
                      >
                        {t("manifesto.device.compareLink")}
                      </Link>{" "}
                      {t("manifesto.device.compareSuffix")}
                    </p>
                  ) : null}
                  {section === "zeroUploads" ? (
                    <p className="privacy-section__prose mt-6 mb-0">
                      {t("manifesto.zeroUploads.policyPrefix")}{" "}
                      <Link
                        href="/privacy/"
                        className="font-semibold text-neutral-600 hover:underline dark:text-neutral-400"
                        prefetch={false}
                      >
                        {t("manifesto.zeroUploads.policyLink")}
                      </Link>{" "}
                      {t("manifesto.zeroUploads.policySuffix")}
                    </p>
                  ) : null}
                </section>
              );
            })}

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

            <nav
              className={clsx(contentDashboardPanel, "privacy-section text-center")}
              aria-label={t("ctaNavLabel")}
            >
              <p className="privacy-section__title text-xl md:text-2xl">{t("ctaReady")}</p>
              <p className="privacy-section__prose mt-3">{t("ctaBody")}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Link href="/tools/" className={homePrimaryPillBtn} prefetch={false}>
                  {t("ctaTools")}
                </Link>
                <Link
                  href="/privacy/"
                  className="font-semibold text-neutral-600 hover:underline dark:text-neutral-400"
                  prefetch={false}
                >
                  {t("privacyPolicy")}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </AppPageShell>
    </>
  );
}
