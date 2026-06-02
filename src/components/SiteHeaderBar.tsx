"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import { SiteSearch } from "@/components/SiteSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToolsMegaMenu } from "@/components/ToolsMegaMenu";
import type { MegaMenuSection } from "@/lib/mega-menu";
import { isNavItemActive, NAV_LINKS } from "@/lib/nav-config";
import type { BlogRegistry, SiteRegistry } from "@/lib/types";

type SiteHeaderBarProps = {
  megaMenuSections: MegaMenuSection[];
  registry: SiteRegistry;
  blog: BlogRegistry;
};

function GuidesLink({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname() || "/";
  const guidesActive = isNavItemActive(pathname, "/blog/");

  return (
    <Link
      href="/blog/"
      className={`nav-link${guidesActive ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      prefetch={false}
      onClick={onNavigate}
    >
      Guides
    </Link>
  );
}

function PrivacyFirstLink({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname() || "/";
  const privacyFirst = NAV_LINKS.find((l) => l.href === "/privacy-first/");
  if (!privacyFirst) return null;
  const active = isNavItemActive(pathname, privacyFirst.href);

  return (
    <Link
      href={privacyFirst.href}
      className={`nav-link nav-link--emphasis${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      prefetch={false}
      onClick={onNavigate}
    >
      {privacyFirst.label}
    </Link>
  );
}

export function SiteHeaderBar({ megaMenuSections, registry, blog }: SiteHeaderBarProps) {
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
        className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4"
        aria-label="Site"
      >
        <Link href="/" className="brand z-10 flex shrink-0 items-center gap-2">
          <HeaderPdfMini className="header-pdf-mini--tight" />
          <span className="brand__text">JoinMyPDF</span>
        </Link>

        <div className="absolute left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 md:flex">
          <ToolsMegaMenu sections={megaMenuSections} />
          <GuidesLink />
          <PrivacyFirstLink />
        </div>

        <div className="z-10 flex shrink-0 items-center gap-2">
          <SiteSearch variant="header" registry={registry} blog={blog} />
          <ThemeToggle />
          <button
            type="button"
            className="site-header__menu-btn md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="primary-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span className="site-header__menu-icon" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div
          id="primary-nav"
          className="border-t border-slate-200/80 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950"
          aria-label="Mobile primary"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <ToolsMegaMenu sections={megaMenuSections} onNavigate={closeMobile} variant="mobile" />
            <GuidesLink onNavigate={closeMobile} className="w-full justify-center py-2" />
            <PrivacyFirstLink onNavigate={closeMobile} className="w-full justify-center py-2" />
          </div>
        </div>
      ) : null}
    </>
  );
}
