import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeHeroLaunch } from "@/components/homepage/HomeHeroLaunch";
import { PopularTools } from "@/components/homepage/PopularTools";
import { QuickActions } from "@/components/homepage/QuickActions";
import { RecentTools } from "@/components/homepage/RecentTools";
import { RecentWorkspaces } from "@/components/homepage/RecentWorkspaces";
import { LocalWorkflowPanel } from "@/components/homepage/LocalWorkflowPanel";
import { WorkflowSpotlight } from "@/components/homepage/WorkflowSpotlight";
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

/** Main dashboard — reached from the welcome splash via Enter. */
export default async function HomeDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");

  return (
    <>
      <HomeStructuredData locale={locale} />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--dashboard home-landing">
          <div className="home-landing__hero">
            <header className="home-landing__intro">
              <h1 className="home-landing__title">{t("landing.heroTitle")}</h1>
              <p className="home-landing__tagline">{t("landing.heroSubtitle")}</p>
            </header>

            <HomeHeroLaunch locale={locale} />
          </div>

          <QuickActions locale={locale} />

          <div className="home-landing__body">
            <div className="home-landing__split">
              <PopularTools locale={locale} />
              <LocalWorkflowPanel />
            </div>

            <div className="home-landing__split">
              <RecentTools locale={locale} />
              <WorkflowSpotlight locale={locale} />
            </div>

            <RecentWorkspaces locale={locale} />
          </div>
        </div>
      </AppPageShell>
    </>
  );
}
