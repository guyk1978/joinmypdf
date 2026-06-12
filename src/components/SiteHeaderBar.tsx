"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteSearch } from "@/components/SiteSearch";
import { HeaderFavoritesButton } from "@/components/HeaderFavoritesButton";
import { HeaderShareButton } from "@/components/HeaderShareButton";
import { InstallPwaButton } from "@/components/InstallPwaButton";
import { HeaderPrivacyIndicator } from "@/components/HeaderPrivacyIndicator";
import { AllToolsNavLink } from "@/components/AllToolsNavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookOpen } from "lucide-react";
import { isNavItemActive } from "@/lib/nav-config";
import type { BlogRegistry, SiteRegistry } from "@/lib/types";

type SiteHeaderBarProps = {
  registry: SiteRegistry;
  blog: BlogRegistry;
};

function GuidesLink({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const t = useTranslations("Header");
  const pathname = usePathname() || "/";
  const guidesActive = isNavItemActive(pathname, "/blog/");

  return (
    <Link
      href="/blog/"
      className={`nav-link${guidesActive ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      prefetch={false}
      onClick={onNavigate}
    >
      <BookOpen className="nav-link__icon shrink-0" aria-hidden />
      {t("guides")}
    </Link>
  );
}

export function SiteHeaderBar({ registry, blog }: SiteHeaderBarProps) {
  const t = useTranslations("Header");
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("site-nav-open", mobileOpen);
    return () => document.body.classList.remove("site-nav-open");
  }, [mobileOpen]);

  return (
    <>
      <nav className="site-header__bar h-[var(--site-header-height,6rem)]" aria-label={t("siteLabel")}>
        <Link href="/" className="brand flex h-full shrink-0 items-center" aria-label="JoinMyPDF">
          <JoinMyPdfLogo />
        </Link>

        <div className="site-header__center hidden h-full flex-1 items-center justify-center md:flex">
          <div className="site-header__nav-cluster flex items-center">
            <AllToolsNavLink />
            <GuidesLink />
          </div>
        </div>

        <div className="site-header__actions flex h-full items-center">
          <HeaderPrivacyIndicator />
          <div className="site-header__utility-cluster flex h-full items-stretch divide-x divide-neutral-200/80 dark:divide-white/10">
          <LanguageSwitcher />
          <div className="relative flex h-full items-center">
            <SiteSearch variant="header" registry={registry} blog={blog} />
          </div>
          <InstallPwaButton />
          <HeaderFavoritesButton />
          <HeaderShareButton />
          <ThemeToggle />
          </div>
          <button
            type="button"
            className="site-header__menu-btn md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="primary-nav"
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span className="site-header__menu-icon" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div
          id="primary-nav"
          className="site-header__mobile-panel border-t border-neutral-200/80 bg-white/90 py-3 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-neutral-950/90"
          aria-label={t("mobileNav")}
        >
          <div className="flex w-full flex-col items-center gap-2">
            <AllToolsNavLink onNavigate={closeMobile} className="w-full justify-center py-2" />
            <GuidesLink onNavigate={closeMobile} className="w-full justify-center py-2" />
            <HeaderPrivacyIndicator
              onNavigate={closeMobile}
              className="!inline-flex sm:!hidden mt-2 w-full max-w-xs justify-center"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
