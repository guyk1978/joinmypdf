import type { Metadata } from "next";
export const runtime = "edge";
import { ProjectsGrid } from "@/components/ProjectsGrid";
import { ProjectsHero } from "@/components/ProjectsHero";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Projects" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/projects` },
  };
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Projects");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("metaTitle"),
          url: absoluteUrl(`/${locale}/projects`),
        }}
      />
      <div className="home-page-shell projects-page-shell min-h-screen text-black dark:text-white">
        <HomePageSeamlessBg />
        <SiteHeader />
        <main className="home-tool-grid-page">
          <ProjectsHero />
          <div className="projects-page-content home-tool-grid-shell mx-auto w-full max-w-4xl">
            <ProjectsGrid locale={locale} />
          </div>
        </main>
        <SiteFooter tagline="tools" />
      </div>
    </>
  );
}
