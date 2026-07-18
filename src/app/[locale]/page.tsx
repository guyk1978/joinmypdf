import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryHubsSection } from "@/components/CategoryHubsSection";
import { PopularTools } from "@/components/homepage/PopularTools";
import { HomeStructuredData } from "@/components/HomeStructuredData";
import { AppPageShell } from "@/components/AppPageShell";
import { routing } from "@/i18n/routing";
import "@/styles/home-landing.css";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}`])),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");

  return (
    <>
      <HomeStructuredData locale={locale} />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--dashboard home-landing">
          <header className="home-landing__intro">
            <h1 className="home-landing__title">{t("landing.heroTitle")}</h1>
            <p className="home-landing__tagline">{t("landing.heroSubtitle")}</p>
          </header>

          <PopularTools locale={locale} />

          <CategoryHubsSection
            className="home-category-launcher"
            hideHead
            dense
            navLabel={t("landing.heroCategoriesLabel")}
          />
        </div>
      </AppPageShell>
    </>
  );
}
