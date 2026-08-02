"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { Library } from "lucide-react";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { HeaderCategoryHub } from "@/components/HeaderCategoryHub";
import { HeaderMobileMenu } from "@/components/HeaderMobileMenu";
import { HeaderOverflowMenu } from "@/components/HeaderOverflowMenu";
import {
  HeaderCategoryNavProvider,
  useHeaderCategoryNavOptional,
  type NavigationDrawerTab,
} from "@/components/HeaderCategoryNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { InstallPwaButton } from "@/components/InstallPwaButton";
import { useOptionalToolModal } from "@/components/tool-modal/tool-modal-context";
import { getBrandName } from "@/lib/brand";
import type { HeaderCategoryId } from "@/lib/tool-registry";

function HeaderLibraryButton() {
  const t = useTranslations("Header");
  const nav = useHeaderCategoryNavOptional();
  const isOpen = Boolean(nav?.open && nav.activeTab !== "all-tools");

  return (
    <button
      type="button"
      className="site-header__nav-link"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      onClick={() => {
        if (!nav) return;
        if (nav.open && nav.activeTab !== "all-tools") nav.close();
        else nav.openDrawer("favorites");
      }}
    >
      <Library className="site-header__nav-icon" aria-hidden size={14} strokeWidth={2} />
      <span>{t("library")}</span>
    </button>
  );
}

export function SiteHeaderBar() {
  const locale = useLocale();
  const t = useTranslations("Header");
  const toolModal = useOptionalToolModal();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavigationDrawerTab>("favorites");
  const [activeCategory, setActiveCategory] = useState<HeaderCategoryId>("all");

  const dismissToolModal = (href?: string) => {
    if (!toolModal?.isOpen) return;
    toolModal.closeToolModal(href ? { href } : undefined);
  };

  return (
    <HeaderCategoryNavProvider
      open={drawerOpen}
      activeTab={activeTab}
      activeCategory={activeCategory}
      onOpenChange={setDrawerOpen}
      onTabChange={setActiveTab}
      onCategoryChange={setActiveCategory}
      onNavigate={() => dismissToolModal()}
    >
      <nav className="site-header__bar site-header__bar--clean" aria-label={t("siteLabel")}>
        <Link
          href="/home"
          className="site-header__brand brand flex shrink-0 items-center"
          aria-label={getBrandName(locale)}
          onClick={(event) => {
            if (!toolModal?.isOpen) return;
            event.preventDefault();
            dismissToolModal("/home");
          }}
        >
          <JoinMyPdfLogo />
        </Link>

        <div className="site-header__desktop-cluster">
          <div className="site-header__search-center">
            <div className="site-header__search-cluster">
              <div className="site-header__search site-header__search--focus">
                <HeaderSearch variant="inline" />
              </div>
              <InstallPwaButton />
            </div>
          </div>

          <div className="site-header__end site-header__end--desktop">
            <HeaderCategoryHub />
            <HeaderLibraryButton />
            <HeaderOverflowMenu onNavigate={() => dismissToolModal()} />
          </div>
        </div>

        <HeaderMobileMenu onNavigate={() => dismissToolModal()} />
      </nav>
    </HeaderCategoryNavProvider>
  );
}
