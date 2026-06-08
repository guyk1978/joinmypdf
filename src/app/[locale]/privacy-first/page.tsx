import type { Metadata } from "next";
import type { ReactNode } from "react";
export const runtime = "edge";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { ComparisonTable } from "@/components/ComparisonTable";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { JsonLd, faqLd } from "@/lib/schema";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { absoluteUrl } from "@/lib/site";
import {
  contentDashboardInset,
  contentDashboardPanel,
  contentDashboardStack,
  toolPageDashboardWidth,
} from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { clsx } from "clsx";
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

const SECTION_TITLE = "text-sm font-semibold tracking-wide text-neutral-900 dark:text-white";

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
    <article className={contentDashboardInset}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-black/[0.06] text-neutral-900 dark:bg-white/[0.06] dark:text-neutral-200">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm">{children}</p>
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
      <SiteHeader />
      <main className={clsx(toolPageDashboardWidth, "px-4 py-8 md:py-10")}>
        <div className={contentDashboardStack}>
          <section className={clsx(contentDashboardPanel, "text-center")}>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              {t("badge")}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 md:text-base">
              <strong className="text-neutral-900 dark:text-white">{t("heroStrong")}</strong>
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm">
              {t("heroBody")}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-[3px]">
              <Link
                href="/tools/"
                className="inline-flex items-center justify-center rounded-md border border-neutral-400 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:border-neutral-500 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              >
                {t("browseTools")}
              </Link>
              <Link
                href="/privacy/"
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-transparent px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t("privacyPolicy")}
              </Link>
            </div>
          </section>

          <section className={contentDashboardPanel}>
            <div className="grid gap-[3px] md:grid-cols-3">
              <TrustCard icon={<Lock className="h-5 w-5" aria-hidden />} title={t("trustLocalTitle")}>
                {t("trustLocalBody")}
              </TrustCard>
              <TrustCard icon={<Shield className="h-5 w-5" aria-hidden />} title={t("trustMarketingTitle")}>
                {t("trustMarketingBody")}
              </TrustCard>
              <TrustCard icon={<Globe className="h-5 w-5" aria-hidden />} title={t("trustVerifyTitle")}>
                {t("trustVerifyBody")}
              </TrustCard>
            </div>
          </section>

          <section className={contentDashboardPanel} aria-labelledby="how-it-works">
            <h2 id="how-it-works" className={SECTION_TITLE}>
              {t("howTitle")}
            </h2>
            <div className="space-y-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm">
              <p>{t("howP1")}</p>
              <p>{t("howP2")}</p>
              <ol className="list-decimal space-y-1.5 ps-5">
                <li>{t("howStep1")}</li>
                <li>{t("howStep2")}</li>
                <li>{t("howStep3")}</li>
              </ol>
            </div>
          </section>

          <section className={clsx(contentDashboardPanel, "p-0")} aria-labelledby="comparison">
            <h2 id="comparison" className={clsx(SECTION_TITLE, "px-6 pt-6")}>
              {t("comparisonTitle")}
            </h2>
            <div className="mt-3">
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

          <section className={contentDashboardPanel} aria-labelledby="use-cases">
            <h2 id="use-cases" className={SECTION_TITLE}>
              {t("useCasesTitle")}
            </h2>
            <div className="mt-3 grid gap-[3px] sm:grid-cols-2">
              {USE_CASE_KEYS.map((key) => (
                <article key={key} className={contentDashboardInset}>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t(`useCases.${key}.title`)}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm">
                    {t(`useCases.${key}.body`)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className={contentDashboardPanel} aria-labelledby="privacy-tools">
            <h2 id="privacy-tools" className={SECTION_TITLE}>
              {t("toolsTitle")}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm">{t("toolsBody")}</p>
            <div className="mt-3">
              <CompactToolCardGrid
                variant="glass"
                items={PRIVACY_TOOL_SLUGS.map((slug) => ({
                  href: `/tools/${slug}/`,
                  label: translateToolItem(tTools, slug, slug),
                  slugHint: slug,
                }))}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm">
              {t("toolsDirectoryPrefix")}{" "}
              <Link href="/tools/" className="font-semibold text-neutral-900 hover:underline dark:text-neutral-200">
                {t("toolsDirectoryLink")}
              </Link>{" "}
              {t("toolsHubMiddle")}{" "}
              <Link
                href="/privacy-first-pdf-tools/"
                className="font-semibold text-neutral-900 hover:underline dark:text-neutral-200"
              >
                {t("toolsHubLink")}
              </Link>
              .
            </p>
          </section>

          <section className={contentDashboardPanel}>
            <h2 className={SECTION_TITLE}>{t("questions")}</h2>
            <div className="mt-3 flex flex-col gap-[3px]">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className={contentDashboardInset}
                >
                  <summary className="cursor-pointer text-sm font-medium text-neutral-900 dark:text-white">{f.q}</summary>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
