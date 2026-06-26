"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { SiteSearch } from "@/components/SiteSearch";
import { HeaderPrivacyIndicator } from "@/components/HeaderPrivacyIndicator";
import { HeaderOverflowMenu } from "@/components/HeaderOverflowMenu";
import { AllToolsNavLink } from "@/components/AllToolsNavLink";
import { getBrandName } from "@/lib/brand";
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
      className={`nav-link nav-link--compact${guidesActive ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      prefetch={false}
      onClick={onNavigate}
    >
      {t("guides")}
    </Link>
  );
}

export function SiteHeaderBar({ registry, blog }: SiteHeaderBarProps) {
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const t = useTranslations("Header");
  const premiumActive = (pathname.endsWith("/") ? pathname : `${pathname}/`) === "/premium-tools/";
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <nav className="site-header__bar" aria-label={t("siteLabel")}>
      <Link href="/" className="site-header__brand brand flex shrink-0 items-center" aria-label={getBrandName(locale)}>
        <JoinMyPdfLogo />
      </Link>

      {isWide ? (
        <div className="site-header__nav-inline flex shrink-0 items-center gap-0.5">
          <AllToolsNavLink compact />
          <GuidesLink />
          <HeaderPrivacyIndicator className="!inline-flex" />
        </div>
      ) : null}

      <div className="site-header__search-trigger flex shrink-0 items-center">
        <SiteSearch variant="header" registry={registry} blog={blog} />
      </div>

      <div className="site-header__end flex shrink-0 items-center gap-2">
        <Link
          href="/premium-tools/"
          className={`site-header__cta hidden sm:inline-flex${premiumActive ? " is-active" : ""}`}
          prefetch={false}
        >
          {t("premiumTools")}
        </Link>
        <HeaderOverflowMenu showNavLinks={!isWide} />
      </div>
    </nav>
  );
}
