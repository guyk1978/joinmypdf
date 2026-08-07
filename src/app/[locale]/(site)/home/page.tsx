import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { HomeStructuredData } from "@/components/HomeStructuredData";
import { AppPageShell } from "@/components/AppPageShell";
import { HomeMarketingLanding } from "@/components/homepage/marketing/HomeMarketingLanding";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const title = t("homeTitle");
  const description = t("homeDescription");
  const canonicalPath = `/${locale}/home`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: `/${locale}/home`,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}/home`]),
      ),
    },
  };
}

/** Local-first marketing homepage — long-form landing (no tool grids). */
export default async function HomeDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HomeStructuredData locale={locale} />
      <AppPageShell>
        <div className="page-container home-marketing-page">
          <HomeMarketingLanding />
        </div>
      </AppPageShell>
    </>
  );
}
