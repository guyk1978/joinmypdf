"use client";

import { useTranslations } from "next-intl";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import type { HomeFeaturedToolItem } from "@/lib/featured-tools";
import type { HomeFeaturedImageItem } from "@/lib/image-tools";
import type { HomeFeaturedUtilityItem } from "@/lib/utilities-tools";
import type { HomeFeaturedTextJsonItem } from "@/lib/text-json-tools";
import type { HomeFeaturedDeveloperItem } from "@/lib/developer-tools";
import type { HomeFeaturedDataConversionItem } from "@/lib/data-conversion-tools";
import type { HomeFeaturedSecurityItem } from "@/lib/security-tools";
import type { HomeFeaturedProductivityItem } from "@/lib/productivity-tools";
import { isHomeTextJsonToolId } from "@/lib/text-json-tools";

type HomeToolGridProps = {
  pdfItems: HomeFeaturedToolItem[];
  imageItems: HomeFeaturedImageItem[];
  developerItems: HomeFeaturedDeveloperItem[];
  dataConversionItems: HomeFeaturedDataConversionItem[];
  securityItems: HomeFeaturedSecurityItem[];
  productivityItems: HomeFeaturedProductivityItem[];
  utilityItems: HomeFeaturedUtilityItem[];
};

function isTextJsonUtilityItem(item: HomeFeaturedUtilityItem): item is HomeFeaturedTextJsonItem {
  return isHomeTextJsonToolId(item.id);
}

export function HomeToolGrid({
  pdfItems,
  imageItems,
  developerItems,
  dataConversionItems,
  securityItems,
  productivityItems,
  utilityItems,
}: HomeToolGridProps) {
  const t = useTranslations("Home");

  return (
    <>
      <header className="home-seo-hero">
        <p className="home-local-processing-badge" role="status">
          {t("localProcessingBadge")}
        </p>
        <h1 className="home-seo-hero__title">{t("seoHeadline")}</h1>
      </header>

      <HomeFeaturedSection
        id="home-pdf-tools"
        title={t("pdfSectionTitle")}
        viewAllHref="/tools/"
        viewAllLabel={t("viewAllPdfTools")}
        variant="dashboard"
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
        variant="dashboard"
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
        id="home-developer-tools"
        title={t("developerSectionTitle")}
        viewAllHref="/developer-tools/"
        viewAllLabel={t("viewAllDeveloperTools")}
        className="home-minimal-section--developer"
        variant="dashboard"
      >
        {developerItems.map((item) => (
          <HomeFeaturedToolCard
            key={item.id}
            href={item.href}
            label={item.label}
            slugHint={item.id}
            developerIconKey={item.iconKey}
          />
        ))}
      </HomeFeaturedSection>

      <HomeFeaturedSection
        id="home-data-conversion-tools"
        title={t("dataConversionSectionTitle")}
        viewAllHref="/data-conversion-tools/"
        viewAllLabel={t("viewAllDataConversionTools")}
        className="home-minimal-section--data-conversion"
        variant="dashboard"
      >
        {dataConversionItems.map((item) => (
          <HomeFeaturedToolCard
            key={item.id}
            href={item.href}
            label={item.label}
            slugHint={item.id}
            dataConversionIconKey={item.iconKey}
          />
        ))}
      </HomeFeaturedSection>

      <HomeFeaturedSection
        id="home-security-tools"
        title={t("securitySectionTitle")}
        viewAllHref="/security-tools/"
        viewAllLabel={t("viewAllSecurityTools")}
        className="home-minimal-section--security"
        variant="dashboard"
      >
        {securityItems.map((item) => (
          <HomeFeaturedToolCard
            key={item.id}
            href={item.href}
            label={item.label}
            slugHint={item.id}
            securityIconKey={item.iconKey}
          />
        ))}
      </HomeFeaturedSection>

      <HomeFeaturedSection
        id="home-productivity-tools"
        title={t("productivitySectionTitle")}
        viewAllHref="/productivity-tools/"
        viewAllLabel={t("viewAllProductivityTools")}
        className="home-minimal-section--productivity"
        variant="dashboard"
      >
        {productivityItems.map((item) => (
          <HomeFeaturedToolCard
            key={item.id}
            href={item.href}
            label={item.label}
            slugHint={item.id}
            productivityIconKey={item.iconKey}
          />
        ))}
      </HomeFeaturedSection>

      <HomeFeaturedSection
        id="home-utility-tools"
        title={t("utilitiesSectionTitle")}
        viewAllHref="/utilities/"
        viewAllLabel={t("viewAllUtilities")}
        className="home-minimal-section--utilities"
        variant="dashboard"
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
    </>
  );
}
