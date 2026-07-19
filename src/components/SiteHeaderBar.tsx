"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { Library } from "lucide-react";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { HeaderCategoryHub } from "@/components/HeaderCategoryHub";
import { HeaderOverflowMenu } from "@/components/HeaderOverflowMenu";
import {
  HeaderCategoryNavProvider,
  useHeaderCategoryNavOptional,
  type NavigationDrawerTab,
} from "@/components/HeaderCategoryNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { getBrandName } from "@/lib/brand";
import type { HeaderCategoryId } from "@/lib/tool-registry";

function HeaderLibraryButton() {
  const t = useTranslations("Header");
  const nav = useHeaderCategoryNavOptional();
  const isOpen = Boolean(nav?.open);

  return (
    <button
      type="button"
      className="site-header__nav-link"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      onClick={() => {
        if (!nav) return;
        if (nav.open) nav.close();
        else nav.openDrawer("favorites");
      }}
    >
      <Library className="site-header__nav-icon" aria-hidden size={16} strokeWidth={1.75} />
      <span>{t("library")}</span>
    </button>
  );
}

export function SiteHeaderBar() {
  const locale = useLocale();
  const t = useTranslations("Header");
  const [isWide, setIsWide] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavigationDrawerTab>("favorites");
  const [activeCategory, setActiveCategory] = useState<HeaderCategoryId>("all");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <HeaderCategoryNavProvider
      open={drawerOpen}
      activeTab={activeTab}
      activeCategory={activeCategory}
      onOpenChange={setDrawerOpen}
      onTabChange={setActiveTab}
      onCategoryChange={setActiveCategory}
    >
      <nav className="site-header__bar site-header__bar--clean" aria-label={t("siteLabel")}>
        <Link
          href="/"
          className="site-header__brand brand flex shrink-0 items-center"
          aria-label={getBrandName(locale)}
        >
          <JoinMyPdfLogo />
        </Link>

        <div className="site-header__search-center">
          {isWide ? (
            <div className="site-header__search site-header__search--focus">
              <HeaderSearch variant="inline" />
            </div>
          ) : (
            <div className="site-header__spacer" aria-hidden />
          )}
        </div>

        <div className="site-header__end">
          <HeaderCategoryHub />
          <HeaderLibraryButton />
          {!isWide ? <HeaderSearch variant="toggle" /> : null}
          <HeaderOverflowMenu />
        </div>
      </nav>
    </HeaderCategoryNavProvider>
  );
}
