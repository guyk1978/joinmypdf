"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { Link } from "@/i18n/navigation";
import { HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import type { HomeFeaturedToolItem } from "@/lib/featured-tools";
import type { HomeFeaturedImageItem } from "@/lib/image-tools";
import type { HomeFeaturedUtilityItem } from "@/lib/utilities-tools";
import type { HomeFeaturedTextJsonItem } from "@/lib/text-json-tools";
import type { HomeFeaturedDeveloperItem } from "@/lib/developer-tools";
import type { HomeFeaturedDataConversionItem } from "@/lib/data-conversion-tools";
import type { HomeFeaturedSecurityItem } from "@/lib/security-tools";
import type { HomeFeaturedProductivityItem } from "@/lib/productivity-tools";
import type { HomeFeaturedAudioItem } from "@/lib/audio-tools";
import { isHomeTextJsonToolId } from "@/lib/text-json-tools";

const CATEGORY_PREVIEW = 3;

type HomeToolGridProps = {
  pdfPowerhouseItems: HomeFeaturedToolItem[];
  imageItems: HomeFeaturedImageItem[];
  developerItems: HomeFeaturedDeveloperItem[];
  dataConversionItems: HomeFeaturedDataConversionItem[];
  securityItems: HomeFeaturedSecurityItem[];
  productivityItems: HomeFeaturedProductivityItem[];
  utilityItems: HomeFeaturedUtilityItem[];
  audioItems: HomeFeaturedAudioItem[];
};

function isTextJsonUtilityItem(item: HomeFeaturedUtilityItem): item is HomeFeaturedTextJsonItem {
  return isHomeTextJsonToolId(item.id);
}

type CategoryBlockProps = {
  id: string;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  cards: ReactNode[];
};

function CategoryBlock({ id, title, viewAllHref, viewAllLabel, cards }: CategoryBlockProps) {
  const t = useTranslations("Home");
  const [expanded, setExpanded] = useState(false);
  const hasMore = cards.length > CATEGORY_PREVIEW;
  const visible = expanded ? cards : cards.slice(0, CATEGORY_PREVIEW);

  return (
    <section className="home-category-block" aria-labelledby={id}>
      <div className="home-category-block__head">
        <h3 id={id} className="home-category-block__title">
          {title}
        </h3>
        <Link href={viewAllHref} className="home-category-block__all" prefetch={false}>
          {viewAllLabel}
          <ArrowRight className="home-category-block__all-icon" aria-hidden />
        </Link>
      </div>
      <div className="home-category-block__list">{visible}</div>
      {hasMore ? (
        <button
          type="button"
          className="home-category-block__toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={id}
        >
          {expanded ? t("landing.showLess") : t("landing.viewCategory")}
          <ChevronDown
            className={clsx("home-category-block__toggle-icon", expanded && "is-open")}
            aria-hidden
          />
        </button>
      ) : null}
    </section>
  );
}

export function HomeToolGrid({
  pdfPowerhouseItems,
  imageItems,
  developerItems,
  dataConversionItems,
  securityItems,
  productivityItems,
  utilityItems,
  audioItems,
}: HomeToolGridProps) {
  const t = useTranslations("Home");

  const categories: CategoryBlockProps[] = [
    {
      id: "home-cat-image",
      title: t("imageSectionTitle"),
      viewAllHref: "/image-tools/",
      viewAllLabel: t("viewAllImageTools"),
      cards: imageItems.map((item) => (
        <HomeFeaturedToolCard
          key={item.id}
          href={item.href}
          label={item.label}
          slugHint={item.id}
          imageIconKey={item.iconKey}
        />
      )),
    },
    {
      id: "home-cat-audio",
      title: t("audioSectionTitle"),
      viewAllHref: "/audio-tools/",
      viewAllLabel: t("viewAllAudioTools"),
      cards: audioItems.map((item) => (
        <HomeFeaturedToolCard
          key={item.id}
          href={item.href}
          label={item.label}
          slugHint={item.id}
          audioIconKey={item.iconKey}
        />
      )),
    },
    {
      id: "home-cat-developer",
      title: t("developerSectionTitle"),
      viewAllHref: "/developer-tools/",
      viewAllLabel: t("viewAllDeveloperTools"),
      cards: developerItems.map((item) => (
        <HomeFeaturedToolCard
          key={item.id}
          href={item.href}
          label={item.label}
          slugHint={item.id}
          developerIconKey={item.iconKey}
        />
      )),
    },
    {
      id: "home-cat-data-conversion",
      title: t("dataConversionSectionTitle"),
      viewAllHref: "/data-conversion-tools/",
      viewAllLabel: t("viewAllDataConversionTools"),
      cards: dataConversionItems.map((item) => (
        <HomeFeaturedToolCard
          key={item.id}
          href={item.href}
          label={item.label}
          slugHint={item.id}
          dataConversionIconKey={item.iconKey}
        />
      )),
    },
    {
      id: "home-cat-security",
      title: t("securitySectionTitle"),
      viewAllHref: "/security-tools/",
      viewAllLabel: t("viewAllSecurityTools"),
      cards: securityItems.map((item) => (
        <HomeFeaturedToolCard
          key={item.id}
          href={item.href}
          label={item.label}
          slugHint={item.id}
          securityIconKey={item.iconKey}
        />
      )),
    },
    {
      id: "home-cat-productivity",
      title: t("productivitySectionTitle"),
      viewAllHref: "/productivity-tools/",
      viewAllLabel: t("viewAllProductivityTools"),
      cards: productivityItems.map((item) => (
        <HomeFeaturedToolCard
          key={item.id}
          href={item.href}
          label={item.label}
          slugHint={item.id}
          productivityIconKey={item.iconKey}
        />
      )),
    },
    {
      id: "home-cat-utilities",
      title: t("utilitiesSectionTitle"),
      viewAllHref: "/utilities/",
      viewAllLabel: t("viewAllUtilities"),
      cards: utilityItems.map((item) => (
        <HomeFeaturedToolCard
          key={item.id}
          href={item.href}
          label={item.label}
          slugHint={item.id}
          faviconIconKey={!isTextJsonUtilityItem(item) ? item.iconKey : undefined}
          textJsonIconKey={isTextJsonUtilityItem(item) ? item.iconKey : undefined}
        />
      )),
    },
  ];

  return (
    <>
      <section className="home-pdf-powerhouse" aria-labelledby="home-pdf-powerhouse-title">
        <div className="home-section-head home-section-head--pdf">
          <p className="home-section-head__eyebrow">{t("landing.pdfEyebrow")}</p>
          <h2 id="home-pdf-powerhouse-title" className="home-section-head__title">
            {t("landing.pdfTitle")}
          </h2>
          <p className="home-section-head__subtitle">{t("landing.pdfSubtitle")}</p>
        </div>

        <div className="home-pdf-powerhouse__grid">
          {pdfPowerhouseItems.map((item) => (
            <HomeFeaturedToolCard
              key={item.slugHint}
              href={item.href}
              label={item.label}
              slugHint={item.slugHint}
            />
          ))}
        </div>

        <div className="home-pdf-powerhouse__footer">
          <Link href="/tools/" className="home-pdf-powerhouse__all" prefetch={false}>
            {t("viewAllPdfTools")}
            <ArrowRight className="home-pdf-powerhouse__all-icon" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="home-more-tools" aria-labelledby="home-more-tools-title">
        <div className="home-section-head">
          <p className="home-section-head__eyebrow">{t("landing.moreEyebrow")}</p>
          <h2 id="home-more-tools-title" className="home-section-head__title">
            {t("landing.moreTitle")}
          </h2>
          <p className="home-section-head__subtitle">{t("landing.moreSubtitle")}</p>
        </div>

        <div className="home-more-tools__grid">
          {categories.map((category) => (
            <CategoryBlock key={category.id} {...category} />
          ))}
        </div>
      </section>
    </>
  );
}
