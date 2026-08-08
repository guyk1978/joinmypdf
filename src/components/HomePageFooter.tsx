"use client";

import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const FOOTER_HEIGHT_VAR = "--site-footer-height";
/** @deprecated kept in sync for older reveal-lid CSS */
const FOOTER_REVEAL_VAR = "--site-footer-reveal-height";

type HomePageFooterProps = {
  /**
   * Legacy reveal mode — footer is still docked fixed at the bottom
   * (always visible, like the site header). Kept for call-site compat.
   */
  reveal?: boolean;
  /**
   * When false, stay in normal document flow (e.g. nested hosts that pin via flex).
   * Default true: fixed to the viewport bottom, always on screen.
   */
  dock?: boolean;
};

/**
 * Site footer chrome — docked to the viewport bottom like the sticky header,
 * so copyright / links stay visible while the page scrolls.
 */
export function HomePageFooter({ reveal = false, dock }: HomePageFooterProps) {
  const tFooter = useTranslations("Footer");
  const year = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const shouldDock = dock ?? true;

  useEffect(() => {
    const el = footerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const publishHeight = () => {
      const next = Math.ceil(el.getBoundingClientRect().height);
      if (next > 0) {
        document.documentElement.style.setProperty(FOOTER_HEIGHT_VAR, `${next}px`);
        document.documentElement.style.setProperty(FOOTER_REVEAL_VAR, `${next}px`);
      }
    };

    publishHeight();
    const ro = new ResizeObserver(publishHeight);
    ro.observe(el);
    window.addEventListener("resize", publishHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publishHeight);
    };
  }, [shouldDock]);

  return (
    <footer
      ref={footerRef}
      className={clsx(
        "home-page-footer w-full shrink-0",
        shouldDock ? "home-page-footer--dock" : "mt-auto",
        reveal && "home-page-footer--reveal",
      )}
      data-site-footer="1"
      data-chrome="industrial-v2"
      data-footer-dock={shouldDock ? "1" : undefined}
      data-footer-reveal={reveal ? "1" : undefined}
    >
      <div className="home-page-footer__inner app-content-rail">
        <div className="home-page-footer__brand">
          <p className="home-page-footer__copy">
            {tFooter("copyrightLine", { year })}
          </p>
          <p className="home-page-footer__badge">
            {tFooter.has("localFirstBadge")
              ? tFooter("localFirstBadge")
              : "Local-first · Zero uploads"}
          </p>
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
