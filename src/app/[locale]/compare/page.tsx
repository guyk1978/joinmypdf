import type { Metadata } from "next";
export const runtime = "edge";
import { clsx } from "clsx";
import { AppPageShell } from "@/components/AppPageShell";
import { ComparisonTable } from "@/components/ComparisonTable";
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
    <AppPageShell>
      <div className="home-minimal-layout home-minimal-layout--directory">
        <h1 className="home-minimal-tagline">{t("title")}</h1>
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
        <p className="privacy-section__prose text-center">
          {t("ctaPrefix")}{" "}
          <Link href="/tools/pdf-merge/" className="home-minimal-section__link">
            {t("ctaMerge")}
          </Link>{" "}
          {t("ctaMiddle")}{" "}
          <Link href="/privacy-first/" className="home-minimal-section__link">
            {t("ctaPrivacy")}
          </Link>
          .
        </p>
      </div>
    </AppPageShell>
  );
}
