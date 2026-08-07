"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Marketing footer — local-first chrome, emerald accent links.
 */
export function HomePageFooter() {
  const tFooter = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="home-page-footer" data-site-footer="1" data-chrome="industrial-v2">
      <div className="home-page-footer__inner app-content-rail">
        <div className="home-page-footer__brand">
          <p className="home-page-footer__copy">
            {tFooter("copyrightLine", { year })}
          </p>
          <p className="home-page-footer__badge">Local-first · Zero uploads</p>
        </div>

        <nav className="home-page-footer__end" aria-label={tFooter("expandFooter")}>
          <Link href="/privacy-policy/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.privacyPolicy")}
          </Link>
          <Link href="/terms/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.terms")}
          </Link>
          <Link href="/tools/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.toolsDirectory")}
          </Link>
          <Link href="/guide/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.guide")}
          </Link>
          <Link href="/contact/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.feedback")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
