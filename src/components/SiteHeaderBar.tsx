"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteSearch } from "@/components/SiteSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToolsMegaMenu } from "@/components/ToolsMegaMenu";
import type { MegaMenuSection } from "@/lib/mega-menu";
import { isNavItemActive } from "@/lib/nav-config";
import type { BlogRegistry, SiteRegistry } from "@/lib/types";

type SiteHeaderBarProps = {
  megaMenuSections: MegaMenuSection[];
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
      {t("guides")}
    </Link>
  );
}

function PrivacyFirstLink({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const t = useTranslations("Header");
  const pathname = usePathname() || "/";
  const active = isNavItemActive(pathname, "/privacy-first/");

  return (
    <Link
      href="/privacy-first/"
      className={`nav-link nav-link--emphasis${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      prefetch={false}
      onClick={onNavigate}
    >
      {t("privacyFirst")}
    </Link>
  );
}

export function SiteHeaderBar({ megaMenuSections, registry, blog }: SiteHeaderBarProps) {
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
      <nav
        className="relative mx-auto flex h-12 max-w-7xl items-stretch justify-between gap-0"
        aria-label={t("siteLabel")}
      >
        <Link href="/" className="brand z-10 flex h-full shrink-0 items-center px-3" aria-label="JoinMyPDF">
          <JoinMyPdfLogo />
        </Link>

        <div className="absolute left-1/2 z-10 hidden h-full -translate-x-1/2 md:flex">
          <div className="flex h-full items-stretch divide-x divide-neutral-300 dark:divide-neutral-800">
            <ToolsMegaMenu sections={megaMenuSections} />
            <GuidesLink />
            <PrivacyFirstLink />
          </div>
        </div>

        <div className="z-10 flex h-full shrink-0 items-stretch divide-x divide-neutral-300 dark:divide-neutral-800">
          <LanguageSwitcher />
          <div className="relative flex h-full items-center">
            <SiteSearch variant="header" registry={registry} blog={blog} />
          </div>
          <ThemeToggle />
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
          className="border-t border-neutral-300 bg-neutral-50 px-3 py-2 md:hidden dark:border-neutral-800 dark:bg-neutral-900"
          aria-label={t("mobileNav")}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <ToolsMegaMenu sections={megaMenuSections} onNavigate={closeMobile} className="w-full justify-center" />
            <GuidesLink onNavigate={closeMobile} className="w-full justify-center py-2" />
            <PrivacyFirstLink onNavigate={closeMobile} className="w-full justify-center py-2" />
          </div>
        </div>
      ) : null}
    </>
  );
}
