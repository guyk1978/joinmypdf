import type { Metadata } from "next";
export const runtime = "edge";
import { clsx } from "clsx";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { CompareHero } from "@/components/CompareHero";
import { ComparisonTable } from "@/components/ComparisonTable";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { contentDashboardPanel } from "@/lib/tool-ui";
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
    <div className="home-page-shell min-h-screen text-black dark:text-white">
      <HomePageSeamlessBg />
      <SiteHeader />
      <CompareHero />
      <main className="compare-content home-tool-grid-shell mx-auto w-full max-w-4xl lg:max-w-5xl">
        <div className="flex flex-col gap-8 md:gap-10">
          <section className={clsx(contentDashboardPanel, "privacy-section !pb-0")} aria-labelledby="compare-table">
            <h2 id="compare-table" className="sr-only">
              {t("title")}
            </h2>
            <ComparisonTable
              locale={locale}
              flush
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
          </section>

          <WattQuickCrossLink className="!border-0 !bg-transparent !p-0 shadow-[var(--surface-elevate)]" />

          <p className="privacy-section__prose text-center">
            {t("ctaPrefix")}{" "}
            <Link href="/tools/pdf-merge/" className="font-semibold text-neutral-600 hover:underline dark:text-neutral-400">
              {t("ctaMerge")}
            </Link>{" "}
            {t("ctaMiddle")}{" "}
            <Link
              href="/privacy-first/"
              className="font-semibold text-neutral-600 hover:underline dark:text-neutral-400"
            >
              {t("ctaPrivacy")}
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
