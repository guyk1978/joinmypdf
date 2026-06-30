"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { HeaderOverflowMenu } from "@/components/HeaderOverflowMenu";
import { HeaderNav } from "@/components/HeaderNav";
import { getBrandName } from "@/lib/brand";

export function SiteHeaderBar() {
  const locale = useLocale();
  const t = useTranslations("Header");
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

      <HeaderNav />

      <div className="site-header__spacer" aria-hidden />

      <div className="site-header__end flex shrink-0 items-center gap-2">
        <Link href="/contact/" className="site-header__login hidden sm:inline-flex" prefetch={false}>
          {t("login")}
        </Link>
        <Link href="/contact/" className="site-header__signup hidden sm:inline-flex" prefetch={false}>
          {t("signup")}
        </Link>
        <HeaderOverflowMenu showNavLinks={!isWide} />
      </div>
    </nav>
  );
}
