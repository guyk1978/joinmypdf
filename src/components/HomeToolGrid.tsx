"use client";

import { useTranslations } from "next-intl";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import type { HomeFeaturedToolItem } from "@/lib/featured-tools";
import type { HomeFeaturedImageItem } from "@/lib/image-tools";
import type { HomeFeaturedFaviconItem } from "@/lib/favicon-tools";

type HomeToolGridProps = {
  pdfItems: HomeFeaturedToolItem[];
  imageItems: HomeFeaturedImageItem[];
  faviconItems: HomeFeaturedFaviconItem[];
};

export function HomeToolGrid({ pdfItems, imageItems, faviconItems }: HomeToolGridProps) {
  const t = useTranslations("Home");

  return (
    <div className="home-minimal-layout">
      <p className="home-minimal-tagline">{t("minimalTagline")}</p>

      <HomeFeaturedSection
        id="home-pdf-tools"
        title={t("pdfSectionTitle")}
        viewAllHref="/tools/"
        viewAllLabel={t("viewAllPdfTools")}
        hideTitle
      >
        {pdfItems.map((item) => (
          <HomeFeaturedToolCard
            key={item.slugHint}
            href={item.href}
            label={item.label}
            slugHint={item.slugHint}
          />
        ))}
      </HomeFeaturedSection>

      <HomeFeaturedSection
        id="home-image-tools"
        title={t("imageSectionTitle")}
        viewAllHref="/image-tools/"
        viewAllLabel={t("viewAllImageTools")}
        className="home-minimal-section--image"
        hideTitle
      >
        {imageItems.map((item) => (
          <HomeFeaturedToolCard
            key={item.id}
            href={item.href}
            label={item.label}
            slugHint={item.id}
            imageIconKey={item.iconKey}
          />
        ))}
      </HomeFeaturedSection>

      <HomeFeaturedSection
        id="home-favicon-tools"
        title={t("faviconSectionTitle")}
        viewAllHref="/favicon-tools/"
        viewAllLabel={t("viewAllFaviconTools")}
        className="home-minimal-section--favicon"
        hideTitle
      >
        {faviconItems.map((item) => (
          <HomeFeaturedToolCard
            key={item.id}
            href={item.href}
            label={item.label}
            slugHint={item.id}
            faviconIconKey={item.iconKey}
          />
        ))}
      </HomeFeaturedSection>
    </div>
  );
}
