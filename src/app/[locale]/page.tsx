import type { Metadata } from "next";



import { getTranslations, setRequestLocale } from "next-intl/server";






import { HomeAuthoritySection } from "@/components/HomeAuthoritySection";
import { getBlogRegistry } from "@/lib/blog-registry";
import { getRecentBlogPosts } from "@/lib/blog-index";

import { AppPageShell } from "@/components/AppPageShell";

import { buildHomepageFeaturedPdfItems } from "@/lib/featured-tools";

import { buildHomepageFeaturedImageItems } from "@/lib/image-tools";
import { buildHomepageFeaturedDeveloperItems } from "@/lib/developer-tools";
import { buildHomepageFeaturedDataConversionItems } from "@/lib/data-conversion-tools";
import { buildHomepageFeaturedSecurityItems } from "@/lib/security-tools";
import { buildHomepageFeaturedProductivityItems } from "@/lib/productivity-tools";
import { buildHomepageFeaturedUtilityItems } from "@/lib/utilities-tools";
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

  const pdfItems = buildHomepageFeaturedPdfItems(tTools);

  const imageItems = buildHomepageFeaturedImageItems(tHome);
  const developerItems = buildHomepageFeaturedDeveloperItems(tHome);
  const dataConversionItems = buildHomepageFeaturedDataConversionItems(tHome);
  const securityItems = buildHomepageFeaturedSecurityItems(tHome);
  const productivityItems = buildHomepageFeaturedProductivityItems(tHome);
  const utilityItems = buildHomepageFeaturedUtilityItems(tHome);
  const latestPosts = getRecentBlogPosts(getBlogRegistry(locale).blog || [], 3);

  return (
    <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--dashboard">
          <HomeToolGrid
            pdfItems={pdfItems}
            imageItems={imageItems}
            developerItems={developerItems}
            dataConversionItems={dataConversionItems}
            securityItems={securityItems}
            productivityItems={productivityItems}
            utilityItems={utilityItems}
          />
          <HomeAuthoritySection latestPosts={latestPosts} />
        </div>
      </AppPageShell>
  );
}


