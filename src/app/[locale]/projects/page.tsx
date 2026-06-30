import type { Metadata } from "next";
export const runtime = "edge";
import { AppPageShell } from "@/components/AppPageShell";
import { ProjectsGrid } from "@/components/ProjectsGrid";
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
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{t("title")}</h1>
          <ProjectsGrid locale={locale} />
        </div>
      </AppPageShell>
    </>
  );
}
