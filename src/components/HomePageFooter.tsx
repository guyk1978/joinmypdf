"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Minimal WattQuick-style footer — copyright left, text links right.
 */
export function HomePageFooter() {
  const tFooter = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="home-page-footer">
      <div className="home-page-footer__inner">
        <p className="home-page-footer__copy">
          {tFooter("copyrightLine", { year })}
        </p>

        <nav className="home-page-footer__end" aria-label={tFooter("expandFooter")}>
          <Link href="/privacy-policy/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.privacyPolicy")}
          </Link>
          <Link href="/terms/" className="home-page-footer__link" prefetch={false}>
            {tFooter("links.terms")}
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
