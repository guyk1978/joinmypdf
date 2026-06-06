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
    <td className="border-b border-slate-100 p-4 align-top text-neutral-800 dark:text-neutral-400 dark:border-slate-800/60 dark:text-slate-400 md:p-3">
      <span className="flex items-start gap-2.5">
        <X className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-neutral-200" strokeWidth={2.5} aria-hidden />
        <span>{children}</span>
      </span>
    </td>
  );
}

function JoinCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-slate-100 bg-neutral-900 dark:bg-neutral-200/50 p-4 align-top text-black dark:text-neutral-200 dark:border-slate-800/60 dark:bg-neutral-900 dark:bg-neutral-200/20 dark:text-slate-200 md:p-3">
      <span className="flex items-start gap-2.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-neutral-200" strokeWidth={2.5} aria-hidden />
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
    <article className="rounded-none border border-neutral-300 dark:border-neutral-800/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-neutral-900 dark:bg-neutral-200 text-black dark:text-neutral-200 dark:bg-neutral-900 dark:bg-neutral-200/50 dark:text-black dark:text-neutral-200">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-black dark:text-neutral-200 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-400 dark:text-slate-300">{children}</p>
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
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-4 md:py-14">
        <section className="rounded-none border border-neutral-300 bg-white px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900 md:px-8 md:py-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">
            {t("badge")}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-black dark:text-neutral-200 dark:text-white md:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-black dark:text-neutral-300 dark:text-slate-300">
            <strong className="text-black dark:text-neutral-200 dark:text-white">{t("heroStrong")}</strong>
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-800 dark:text-neutral-400 dark:text-slate-400">{t("heroBody")}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tools/"
              className="inline-flex items-center justify-center rounded-none bg-neutral-900 dark:bg-neutral-200 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900 dark:bg-neutral-200 dark:bg-neutral-900 dark:bg-neutral-200 dark:hover:bg-neutral-900 dark:bg-neutral-200"
            >
              {t("browseTools")}
            </Link>
            <Link
              href="/privacy/"
              className="inline-flex items-center justify-center rounded-none border border-neutral-300 dark:border-neutral-800 bg-white px-4 py-3 text-sm font-semibold text-black dark:text-neutral-200 transition hover:bg-neutral-100 dark:bg-neutral-950 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("privacyPolicy")}
            </Link>
          </div>
        </section>

        <section className="mt-14 grid gap-3 md:grid-cols-3">
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

        <section className="mt-16 space-y-3" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-2xl font-bold text-black dark:text-neutral-200 dark:text-white">
            {t("howTitle")}
          </h2>
          <div className="space-y-4 text-black dark:text-neutral-300 dark:text-slate-300">
            <p>{t("howP1")}</p>
            <p>{t("howP2")}</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm md:text-base">
              <li>{t("howStep1")}</li>
              <li>{t("howStep2")}</li>
              <li>{t("howStep3")}</li>
            </ol>
          </div>
        </section>

        <section className="mt-16 space-y-3" aria-labelledby="comparison">
          <h2 id="comparison" className="text-2xl font-bold text-black dark:text-neutral-200 dark:text-white">
            {t("comparisonTitle")}
          </h2>
          <div className="overflow-x-auto rounded-none border border-neutral-300 dark:border-neutral-800 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-950 text-xs uppercase tracking-wider text-black dark:text-neutral-200 dark:bg-slate-800/80 dark:text-slate-200">
                <tr>
                  <th className="p-4 font-semibold md:p-3">{t("colTopic")}</th>
                  <th className="p-4 font-semibold md:p-3">{t("colTypical")}</th>
                  <th className="bg-neutral-900 dark:bg-neutral-200/60 p-4 font-extrabold text-black dark:text-neutral-200 dark:bg-neutral-900 dark:bg-neutral-200/30 dark:text-black dark:text-neutral-200 md:p-3">
                    {t("colJoin")}
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-b-0">
                {COMPARISON_ROW_KEYS.map((key) => (
                  <tr key={key}>
                    <td className="border-b border-slate-100 p-4 align-top font-semibold text-black dark:text-neutral-200 dark:border-slate-800/60 dark:text-slate-100 md:p-3">
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

        <section className="mt-16 space-y-3" aria-labelledby="use-cases">
          <h2 id="use-cases" className="text-2xl font-bold text-black dark:text-neutral-200 dark:text-white">
            {t("useCasesTitle")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {USE_CASE_KEYS.map((key) => (
              <article
                key={key}
                className="rounded-none border border-neutral-300 dark:border-neutral-800/80 bg-neutral-100 dark:bg-neutral-950/80 p-3 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <h3 className="font-semibold text-black dark:text-neutral-200 dark:text-white">{t(`useCases.${key}.title`)}</h3>
                <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400 dark:text-slate-300">{t(`useCases.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-3" aria-labelledby="privacy-tools">
          <h2 id="privacy-tools" className="text-2xl font-bold text-black dark:text-neutral-200 dark:text-white">
            {t("toolsTitle")}
          </h2>
          <p className="text-black dark:text-neutral-300 dark:text-slate-300">{t("toolsBody")}</p>
          <CompactToolCardGrid
            items={PRIVACY_TOOL_SLUGS.map((slug) => ({
              href: `/tools/${slug}/`,
              label: translateToolItem(tTools, slug, slug),
              slugHint: slug,
            }))}
          />
          <p className="text-sm text-neutral-800 dark:text-neutral-400 dark:text-slate-400">
            {t("toolsDirectoryPrefix")}{" "}
            <Link href="/tools/" className="font-semibold text-black dark:text-neutral-200 hover:underline dark:text-black dark:text-neutral-200">
              {t("toolsDirectoryLink")}
            </Link>{" "}
            {t("toolsHubMiddle")}{" "}
            <Link
              href="/privacy-first-pdf-tools/"
              className="font-semibold text-black dark:text-neutral-200 hover:underline dark:text-black dark:text-neutral-200"
            >
              {t("toolsHubLink")}
            </Link>
            .
          </p>
        </section>

        <section className="mt-16 rounded-none border border-neutral-300 dark:border-neutral-800/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:p-4">
          <h2 className="text-xl font-bold text-black dark:text-neutral-200 dark:text-white">{t("questions")}</h2>
          <div className="mt-4 space-y-2">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 px-4 py-3 dark:border-neutral-300 dark:border-neutral-800 dark:bg-slate-800/50"
              >
                <summary className="cursor-pointer font-medium text-black dark:text-neutral-200 dark:text-white">{f.q}</summary>
                <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400 dark:text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
