"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { HeaderOverflowMenu } from "@/components/HeaderOverflowMenu";
import {
  HeaderAllToolsButton,
  HeaderCategoryButtons,
  HeaderCategoryNavProvider,
} from "@/components/HeaderCategoryNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { getBrandName } from "@/lib/brand";
import type { HeaderCategoryId } from "@/lib/tool-registry";

export function SiteHeaderBar() {
  const locale = useLocale();
  const t = useTranslations("Header");
  const [isWide, setIsWide] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<HeaderCategoryId>("all");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const openCategory = (category: HeaderCategoryId) => {
    setActiveCategory(category);
    setModalOpen(true);
  };

  return (
    <HeaderCategoryNavProvider
      open={modalOpen}
      activeCategory={activeCategory}
      onOpenChange={setModalOpen}
      onCategoryChange={setActiveCategory}
    >
      <nav className="site-header__bar" aria-label={t("siteLabel")}>
        <Link href="/" className="site-header__brand brand flex shrink-0 items-center" aria-label={getBrandName(locale)}>
          <JoinMyPdfLogo />
        </Link>

        {isWide ? <HeaderCategoryButtons /> : null}

        {isWide ? (
          <div className="site-header__search">
            <HeaderSearch variant="inline" />
          </div>
        ) : null}

        <div className="site-header__spacer" aria-hidden />

        {isWide ? <HeaderAllToolsButton /> : null}

        <div className="site-header__end">
          {!isWide ? <HeaderSearch variant="toggle" /> : null}
          <HeaderOverflowMenu showNavLinks={!isWide} onOpenCategory={openCategory} />
        </div>
      </nav>
    </HeaderCategoryNavProvider>
  );
}
