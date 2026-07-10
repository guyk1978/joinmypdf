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

import { buildHomepageFeaturedImageItems } from "@/lib/image-tools";
import { buildHomepageFeaturedDeveloperItems } from "@/lib/developer-tools";
import { buildHomepageFeaturedDataConversionItems } from "@/lib/data-conversion-tools";
import { buildHomepageFeaturedSecurityItems } from "@/lib/security-tools";
import { buildHomepageFeaturedProductivityItems } from "@/lib/productivity-tools";
import { buildHomepageFeaturedUtilityItems } from "@/lib/utilities-tools";
import { buildHomepageFeaturedAudioItems } from "@/lib/audio-tools";
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

  const tHome = await getTranslations("Home");
  const tTools = await getTranslations("Tools");

  const pdfPowerhouseItems = buildHomepagePdfPowerhouseItems(tTools);

  const imageItems = buildHomepageFeaturedImageItems(tHome);
  const developerItems = buildHomepageFeaturedDeveloperItems(tHome);
  const dataConversionItems = buildHomepageFeaturedDataConversionItems(tHome);
  const securityItems = buildHomepageFeaturedSecurityItems(tHome);
  const productivityItems = buildHomepageFeaturedProductivityItems(tHome);
  const utilityItems = buildHomepageFeaturedUtilityItems(tHome);
  const audioItems = buildHomepageFeaturedAudioItems();
  const latestPosts = getRecentBlogPosts(getBlogRegistry(locale).blog || [], 3);

  return (
    <>
      <HomeStructuredData locale={locale} />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--dashboard home-landing">
          <Hero />
          <HomeWorkflows />
          <HomeToolGrid
            pdfPowerhouseItems={pdfPowerhouseItems}
            imageItems={imageItems}
            developerItems={developerItems}
            dataConversionItems={dataConversionItems}
            securityItems={securityItems}
            productivityItems={productivityItems}
            utilityItems={utilityItems}
            audioItems={audioItems}
          />
          <HomeAuthoritySection latestPosts={latestPosts} locale={locale} />
        </div>
      </AppPageShell>
    </>
  );
}


