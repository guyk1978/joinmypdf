import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeAuthoritySection } from "@/components/HomeAuthoritySection";
import { Hero } from "@/components/Hero";
import "@/styles/home-landing.css";
import { HomeWorkflows } from "@/components/HomeWorkflows";
import { HomeStructuredData } from "@/components/HomeStructuredData";
import { getBlogRegistry } from "@/lib/blog-registry";
import { getRecentBlogPosts } from "@/lib/blog-index";
import { AppPageShell } from "@/components/AppPageShell";
import { buildHomepagePdfPowerhouseItems } from "@/lib/featured-tools";
import { HomeToolGrid } from "@/components/HomeToolGrid";
import { routing } from "@/i18n/routing";

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

  const tTools = await getTranslations("Tools");
  const pdfPowerhouseItems = buildHomepagePdfPowerhouseItems(tTools);
  const latestPosts = getRecentBlogPosts(getBlogRegistry(locale).blog || [], 3);

  return (
    <>
      <HomeStructuredData locale={locale} />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--dashboard home-landing">
          <Hero />
          <HomeWorkflows />
          <HomeToolGrid pdfPowerhouseItems={pdfPowerhouseItems} />
          <HomeAuthoritySection latestPosts={latestPosts} locale={locale} />
        </div>
      </AppPageShell>
    </>
  );
}
