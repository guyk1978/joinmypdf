import type { Metadata } from "next";
export const runtime = "edge";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { ComparisonTable } from "@/components/ComparisonTable";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

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

        <ComparisonTable
          locale={locale}
          headers={{
            topic: t("colTopic"),
            typical: t("colTypical"),
            join: t("colJoin"),
          }}
          rows={ROW_KEYS.map((key) => ({
            topic: t(`rows.${key}.topic`),
            typical: t(`rows.${key}.typical`),
            join: t(`rows.${key}.join`),
          }))}
        />

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
