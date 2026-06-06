import type { Metadata } from "next";
import type { ReactNode } from "react";
export const runtime = "edge";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { JsonLd, faqLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, Globe, Lock, Shield, X } from "lucide-react";

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
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/privacy-first` },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: absoluteUrl(`/${locale}/privacy-first`),
    },
  };
}

function TypicalCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-slate-100 p-4 align-top text-slate-600 dark:border-slate-800/60 dark:text-slate-400 md:p-5">
      <span className="flex items-start gap-2.5">
        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" strokeWidth={2.5} aria-hidden />
        <span>{children}</span>
      </span>
    </td>
  );
}

function JoinCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-slate-100 bg-emerald-50/50 p-4 align-top text-slate-800 dark:border-slate-800/60 dark:bg-emerald-950/20 dark:text-slate-200 md:p-5">
      <span className="flex items-start gap-2.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
        <span className="font-medium">{children}</span>
      </span>
    </td>
  );
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
    <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</p>
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
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-6 py-12 text-center shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950/30 md:px-12 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t("badge")}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">{t("heroStrong")}</strong>
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{t("heroBody")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tools/"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {t("browseTools")}
            </Link>
            <Link
              href="/privacy/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("privacyPolicy")}
            </Link>
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-3">
          <TrustCard icon={<Lock className="h-6 w-6" aria-hidden />} title={t("trustLocalTitle")}>
            {t("trustLocalBody")}
          </TrustCard>
          <TrustCard icon={<Shield className="h-6 w-6" aria-hidden />} title={t("trustMarketingTitle")}>
            {t("trustMarketingBody")}
          </TrustCard>
          <TrustCard icon={<Globe className="h-6 w-6" aria-hidden />} title={t("trustVerifyTitle")}>
            {t("trustVerifyBody")}
          </TrustCard>
        </section>

        <section className="mt-16 space-y-6" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("howTitle")}
          </h2>
          <div className="space-y-4 text-slate-700 dark:text-slate-300">
            <p>{t("howP1")}</p>
            <p>{t("howP2")}</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm md:text-base">
              <li>{t("howStep1")}</li>
              <li>{t("howStep2")}</li>
              <li>{t("howStep3")}</li>
            </ol>
          </div>
        </section>

        <section className="mt-16 space-y-6" aria-labelledby="comparison">
          <h2 id="comparison" className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("comparisonTitle")}
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-900 dark:bg-slate-800/80 dark:text-slate-200">
                <tr>
                  <th className="p-4 font-semibold md:p-5">{t("colTopic")}</th>
                  <th className="p-4 font-semibold md:p-5">{t("colTypical")}</th>
                  <th className="bg-emerald-50/60 p-4 font-extrabold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 md:p-5">
                    {t("colJoin")}
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-b-0">
                {COMPARISON_ROW_KEYS.map((key) => (
                  <tr key={key}>
                    <td className="border-b border-slate-100 p-4 align-top font-semibold text-slate-900 dark:border-slate-800/60 dark:text-slate-100 md:p-5">
                      {t(`rows.${key}.topic`)}
                    </td>
                    <TypicalCell>{t(`rows.${key}.typical`)}</TypicalCell>
                    <JoinCell>{t(`rows.${key}.join`)}</JoinCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 space-y-6" aria-labelledby="use-cases">
          <h2 id="use-cases" className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("useCasesTitle")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {USE_CASE_KEYS.map((key) => (
              <article
                key={key}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white">{t(`useCases.${key}.title`)}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t(`useCases.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-6" aria-labelledby="privacy-tools">
          <h2 id="privacy-tools" className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("toolsTitle")}
          </h2>
          <p className="text-slate-700 dark:text-slate-300">{t("toolsBody")}</p>
          <CompactToolCardGrid
            items={PRIVACY_TOOL_SLUGS.map((slug) => ({
              href: `/tools/${slug}/`,
              label: translateToolItem(tTools, slug, slug),
              slugHint: slug,
            }))}
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("toolsDirectoryPrefix")}{" "}
            <Link href="/tools/" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              {t("toolsDirectoryLink")}
            </Link>{" "}
            {t("toolsHubMiddle")}{" "}
            <Link
              href="/privacy-first-pdf-tools/"
              className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              {t("toolsHubLink")}
            </Link>
            .
          </p>
        </section>

        <section className="mt-16 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("questions")}</h2>
          <div className="mt-4 space-y-2">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <summary className="cursor-pointer font-medium text-slate-900 dark:text-white">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
