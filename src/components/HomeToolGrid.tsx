"use client";

import { useTranslations } from "next-intl";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import type { HomeFeaturedToolItem } from "@/lib/featured-tools";
import type { HomeFeaturedImageItem } from "@/lib/image-tools";
import type { HomeFeaturedUtilityItem } from "@/lib/utilities-tools";
import type { HomeFeaturedTextJsonItem } from "@/lib/text-json-tools";
import { isHomeTextJsonToolId } from "@/lib/text-json-tools";

type HomeToolGridProps = {
  pdfItems: HomeFeaturedToolItem[];
  imageItems: HomeFeaturedImageItem[];
  utilityItems: HomeFeaturedUtilityItem[];
};

function isTextJsonUtilityItem(item: HomeFeaturedUtilityItem): item is HomeFeaturedTextJsonItem {
  return isHomeTextJsonToolId(item.id);
}

export function HomeToolGrid({ pdfItems, imageItems, utilityItems }: HomeToolGridProps) {
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
        id="home-utility-tools"
        title={t("utilitiesSectionTitle")}
        viewAllHref="/utilities/"
        viewAllLabel={t("viewAllUtilities")}
        className="home-minimal-section--utilities"
        hideTitle
      >
        {utilityItems.map((item) => (
          <HomeFeaturedToolCard
            key={item.id}
            href={item.href}
            label={item.label}
            slugHint={item.id}
            faviconIconKey={!isTextJsonUtilityItem(item) ? item.iconKey : undefined}
            textJsonIconKey={isTextJsonUtilityItem(item) ? item.iconKey : undefined}
          />
        ))}
      </HomeFeaturedSection>
    </div>
  );
}
