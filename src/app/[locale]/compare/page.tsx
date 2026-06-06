import type { Metadata } from "next";
import type { ReactNode } from "react";
export const runtime = "edge";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, X } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

const ROW_KEYS = ["processing", "watermarks", "breadth", "bestFor"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Compare" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/compare` },
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

function JoinMyPdfCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-slate-100 bg-blue-50/40 p-4 align-top text-slate-800 dark:border-slate-800/60 dark:bg-blue-950/20 dark:text-slate-200 md:p-5">
      <span className="flex items-start gap-2.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
        <span className="font-medium">{children}</span>
      </span>
    </td>
  );
}

export default async function ComparePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Compare");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10 md:px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
          <p className="text-slate-700 dark:text-slate-300">
            {locale === "en" ? (
              <>
                JoinMyPDF is not trying to clone every feature of giant PDF suites. We optimize for{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{t("introPrivacy")}</span>,{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{t("introUx")}</span>, and{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{t("introSpeed")}</span>.
              </>
            ) : (
              t("intro")
            )}
          </p>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-900 dark:bg-slate-800/80 dark:text-slate-200">
              <tr>
                <th className="p-4 font-semibold md:p-5">{t("colTopic")}</th>
                <th className="p-4 font-semibold md:p-5">{t("colTypical")}</th>
                <th className="bg-blue-50/40 p-4 font-extrabold text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 md:p-5">
                  {t("colJoin")}
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-b-0">
              {ROW_KEYS.map((key) => (
                <tr key={key}>
                  <td className="border-b border-slate-100 p-4 align-top font-semibold text-slate-900 dark:border-slate-800/60 dark:text-slate-100 md:p-5">
                    {t(`rows.${key}.topic`)}
                  </td>
                  <TypicalCell>{t(`rows.${key}.typical`)}</TypicalCell>
                  <JoinMyPdfCell>{t(`rows.${key}.join`)}</JoinMyPdfCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <WattQuickCrossLink />

        <p className="text-sm text-slate-700 dark:text-slate-300">
          {t("ctaPrefix")}{" "}
          <Link href="/tools/pdf-merge/" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            {t("ctaMerge")}
          </Link>{" "}
          {t("ctaMiddle")}{" "}
          <Link
            href="/privacy-first-pdf-tools/"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("ctaPrivacy")}
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
