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
    <td className="border-b border-neutral-300 dark:border-neutral-800 p-4 align-top text-black dark:text-neutral-200 dark:border-neutral-300 dark:border-neutral-800 dark:text-black dark:text-neutral-200 md:p-3">
      <span className="flex items-start gap-2.5">
        <X className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-neutral-200" strokeWidth={2.5} aria-hidden />
        <span>{children}</span>
      </span>
    </td>
  );
}

function JoinMyPdfCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-neutral-300 dark:border-neutral-800 bg-neutral-900/40 p-4 align-top text-black dark:text-neutral-200 dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/20 dark:text-black dark:text-neutral-200 md:p-3">
      <span className="flex items-start gap-2.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-neutral-200" strokeWidth={2.5} aria-hidden />
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
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10 md:px-4">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-black dark:text-neutral-200 dark:text-white">{t("title")}</h1>
          <p className="text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">
            {locale === "en" ? (
              <>
                JoinMyPDF is not trying to clone every feature of giant PDF suites. We optimize for{" "}
                <span className="font-semibold text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{t("introPrivacy")}</span>,{" "}
                <span className="font-semibold text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{t("introUx")}</span>, and{" "}
                <span className="font-semibold text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{t("introSpeed")}</span>.
              </>
            ) : (
              t("intro")
            )}
          </p>
        </header>

        <div className="overflow-x-auto rounded-none border border-neutral-300 dark:border-neutral-800 bg-white dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-950 text-xs uppercase tracking-wider text-black dark:text-neutral-200 dark:bg-neutral-200 dark:bg-neutral-900 dark:text-black dark:text-neutral-200">
              <tr>
                <th className="p-4 font-semibold md:p-3">{t("colTopic")}</th>
                <th className="p-4 font-semibold md:p-3">{t("colTypical")}</th>
                <th className="bg-neutral-900/40 p-4 font-extrabold text-black dark:text-neutral-200 dark:bg-neutral-900/20 dark:text-black dark:text-neutral-200 md:p-3">
                  {t("colJoin")}
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-b-0">
              {ROW_KEYS.map((key) => (
                <tr key={key}>
                  <td className="border-b border-neutral-300 dark:border-neutral-800 p-4 align-top font-semibold text-black dark:text-neutral-200 dark:border-neutral-300 dark:border-neutral-800 dark:text-black dark:text-neutral-200 md:p-3">
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

        <p className="text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">
          {t("ctaPrefix")}{" "}
          <Link href="/tools/pdf-merge/" className="font-semibold text-black dark:text-neutral-200 hover:underline dark:text-black dark:text-neutral-200">
            {t("ctaMerge")}
          </Link>{" "}
          {t("ctaMiddle")}{" "}
          <Link
            href="/privacy-first-pdf-tools/"
            className="font-semibold text-black dark:text-neutral-200 hover:underline dark:text-black dark:text-neutral-200"
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
