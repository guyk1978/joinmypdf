import type { Metadata } from "next";



import { getTranslations, setRequestLocale } from "next-intl/server";






import { AppPageShell } from "@/components/AppPageShell";

import { HomeToolGrid } from "@/components/HomeToolGrid";

import { routing } from "@/i18n/routing";

import { getBrandName } from "@/lib/brand";

import { buildHomepageFeaturedPdfItems } from "@/lib/featured-tools";

import { buildHomepageFeaturedImageItems } from "@/lib/image-tools";
import { buildHomepageFeaturedDeveloperItems } from "@/lib/developer-tools";
import { buildHomepageFeaturedDataConversionItems } from "@/lib/data-conversion-tools";
import { buildHomepageFeaturedSecurityItems } from "@/lib/security-tools";
import { buildHomepageFeaturedProductivityItems } from "@/lib/productivity-tools";
import { buildHomepageFeaturedUtilityItems } from "@/lib/utilities-tools";

import { JsonLd } from "@/lib/schema";

import { absoluteUrl } from "@/lib/site";



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

  const tMeta = await getTranslations("Metadata");

  const pdfItems = buildHomepageFeaturedPdfItems(tTools);

  const imageItems = buildHomepageFeaturedImageItems(tHome);
  const developerItems = buildHomepageFeaturedDeveloperItems(tHome);
  const dataConversionItems = buildHomepageFeaturedDataConversionItems(tHome);
  const securityItems = buildHomepageFeaturedSecurityItems(tHome);
  const productivityItems = buildHomepageFeaturedProductivityItems(tHome);
  const utilityItems = buildHomepageFeaturedUtilityItems(tHome);



  return (

    <>

      <JsonLd

        data={{

          "@context": "https://schema.org",

          "@type": "WebSite",

          name: getBrandName(locale),

          url: absoluteUrl(`/${locale}`),

          description: tMeta("homeDescription"),

        }}

      />

      <AppPageShell>

        <h1 className="sr-only">{tHome("headline")}</h1>

        <HomeToolGrid
          pdfItems={pdfItems}
          imageItems={imageItems}
          developerItems={developerItems}
          dataConversionItems={dataConversionItems}
          securityItems={securityItems}
          productivityItems={productivityItems}
          utilityItems={utilityItems}
        />

      </AppPageShell>

    </>

  );

}


