"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { routing, type AppLocale } from "@/i18n/routing";

export function HomePageFooter() {
  const tFooter = useTranslations("Footer");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname() || "/";
  const router = useRouter();
  const nextLocale = routing.locales.find((item) => item !== locale) ?? routing.defaultLocale;

  const switchLocale = () => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <footer className="home-page-footer">
      <div className="home-page-footer__inner">
        <button
          type="button"
          className="home-locale-orb"
          onClick={switchLocale}
          aria-label={nextLocale === "he" ? "עברית" : "English"}
        >
          {locale === "he" ? "א" : "En"}
        </button>

        <nav className="home-page-footer__end" aria-label={tFooter("expandFooter")}>
          <Link href="/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.home")}
          </Link>
          <Link href="/tools/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.allTools")}
          </Link>
          <Link href="/contact/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.contact")}
          </Link>
        </nav>

        <Link href="/" className="home-page-footer__logo-link" aria-label="JoinMyPDF">
          <JoinMyPdfLogo className="home-page-footer__logo" />
        </Link>
      </div>
    </footer>
  );
}
