"use client";

import {
  BookOpen,
  Check,
  Download,
  LayoutGrid,
  Library,
  MessageSquareText,
  Pin,
  Share2,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { HeaderSearch } from "@/components/HeaderSearch";
import { useHeaderCategoryNavOptional } from "@/components/HeaderCategoryNav";
import { usePageShare } from "@/hooks/usePageShare";
import { routing, type AppLocale } from "@/i18n/routing";
import { remapLocalizedToolPathname } from "@/lib/locale-tool-slugs";
import {
  promptPwaInstall,
  subscribePwaInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";
import {
  getInventoryToolsByCategory,
  listDedicatedInventoryHubLinks,
} from "@/lib/tools-inventory-query";

type HeaderMobileMenuProps = {
  onNavigate?: () => void;
};

/**
 * Mobile header control: hamburger → slide-out drawer with search,
 * categories, library, and secondary site links.
 */
export function HeaderMobileMenu({ onNavigate }: HeaderMobileMenuProps) {
  const t = useTranslations("Header");
  const tHome = useTranslations("Home");
  const tLang = useTranslations("LanguageSwitcher");
  const tShare = useTranslations("Share");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname() || "/";
  const router = useRouter();
  const nav = useHeaderCategoryNavOptional();
  const { handleShare, copied, busy } = usePageShare();

  const panelId = useId();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installVisible, setInstallVisible] = useState(false);

  const categories = useMemo(
    () =>
      listDedicatedInventoryHubLinks().map((category) => ({
        ...category,
        toolCount: getInventoryToolsByCategory(category.id).length,
      })),
    [],
  );

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsub = subscribePwaInstallPrompt((prompt) => {
      setInstallPrompt(prompt);
      setInstallVisible(Boolean(prompt));
    });
    const onInstalled = () => {
      setInstallPrompt(null);
      setInstallVisible(false);
    };
    window.addEventListener("joinmypdf:pwa-installed", onInstalled);
    return () => {
      unsub();
      window.removeEventListener("joinmypdf:pwa-installed", onInstalled);
    };
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const selectLocale = (nextLocale: AppLocale) => {
    if (!routing.locales.includes(nextLocale) || nextLocale === locale) {
      close();
      return;
    }
    const nextPath = remapLocalizedToolPathname(pathname, nextLocale);
    router.replace(nextPath, { locale: nextLocale });
    onNavigate?.();
    close();
  };

  const onInstall = async () => {
    if (!installPrompt) return;
    const outcome = await promptPwaInstall();
    setInstallPrompt(null);
    if (outcome === "accepted") setInstallVisible(false);
    close();
  };

  const go = () => {
    onNavigate?.();
    close();
  };

  const openLibrary = () => {
    close();
    // Allow drawer close animation / lock release before opening Library.
    window.setTimeout(() => nav?.openDrawer("favorites"), 0);
  };

  const resolveTitle = (id: string, fallback: string) => {
    const key = `landing.categoryTitles.${id}`;
    return tHome.has(key) ? tHome(key) : fallback;
  };

  const blogActive = pathname.includes("/blog");
  const reviewsActive = pathname.includes("/reviews");
  const aboutActive = pathname.includes("/about");
  const termsActive = pathname.includes("/terms");
  const privacyPolicyActive = pathname.includes("/privacy-policy");
  const contactActive = pathname.includes("/contact");
  const toolsDirectoryActive = pathname === "/tools" || pathname === "/tools/";
  const pinnedToolsActive = pathname.includes("/pinned-tools");

  const drawer =
    mounted && open
      ? createPortal(
          <div className={clsx("site-mobile-nav", open && "is-open")} role="presentation">
            <button
              type="button"
              className="site-mobile-nav__backdrop"
              aria-label={t("closeMenu")}
              onClick={close}
            />
            <div
              id={panelId}
              className="site-mobile-nav__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <div className="site-mobile-nav__header">
                <h2 id={titleId} className="site-mobile-nav__title">
                  {t("menu")}
                </h2>
                <button
                  type="button"
                  className="site-mobile-nav__close"
                  aria-label={t("closeMenu")}
                  onClick={close}
                >
                  <X size={20} strokeWidth={2} aria-hidden />
                </button>
              </div>

              <div className="site-mobile-nav__body">
                <div className="site-mobile-nav__search">
                  <HeaderSearch variant="inline" />
                </div>

                <p className="site-mobile-nav__heading">{t("toolsHub")}</p>
                <ul className="site-mobile-nav__list">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={category.href}
                        className="site-mobile-nav__link"
                        prefetch={false}
                        onClick={go}
                      >
                        <span>{resolveTitle(category.id, category.title)}</span>
                        <span className="site-mobile-nav__count">{category.toolCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <button type="button" className="site-mobile-nav__action" onClick={openLibrary}>
                  <Library size={16} strokeWidth={2} aria-hidden />
                  <span>{t("library")}</span>
                </button>

                <div className="site-mobile-nav__divider" role="separator" />

                <Link
                  href="/tools/"
                  className={clsx("site-mobile-nav__action", toolsDirectoryActive && "is-active")}
                  prefetch={false}
                  onClick={go}
                >
                  <LayoutGrid size={16} strokeWidth={2} aria-hidden />
                  <span>{t("allTools.button")}</span>
                </Link>
                <Link
                  href="/blog/"
                  className={clsx("site-mobile-nav__action", blogActive && "is-active")}
                  prefetch={false}
                  onClick={go}
                >
                  <BookOpen size={16} strokeWidth={2} aria-hidden />
                  <span>{t("blog")}</span>
                </Link>
                <Link
                  href="/reviews/"
                  className={clsx("site-mobile-nav__action", reviewsActive && "is-active")}
                  prefetch={false}
                  onClick={go}
                >
                  <MessageSquareText size={16} strokeWidth={2} aria-hidden />
                  <span>{t("reviews")}</span>
                </Link>

                <div className="site-mobile-nav__divider" role="separator" />

                <p className="site-mobile-nav__heading">{t("siteLabel")}</p>
                <Link
                  href="/pinned-tools/"
                  className={clsx("site-mobile-nav__link", pinnedToolsActive && "is-active")}
                  prefetch={false}
                  onClick={go}
                >
                  <span className="inline-flex items-center gap-2">
                    <Pin size={14} strokeWidth={2} aria-hidden />
                    {t("pinnedTools")}
                  </span>
                </Link>
                <Link
                  href="/about/"
                  className={clsx("site-mobile-nav__link", aboutActive && "is-active")}
                  prefetch={false}
                  onClick={go}
                >
                  {t("about")}
                </Link>
                <Link
                  href="/terms/"
                  className={clsx("site-mobile-nav__link", termsActive && "is-active")}
                  prefetch={false}
                  onClick={go}
                >
                  {t("termsOfService")}
                </Link>
                <Link
                  href="/privacy-policy/"
                  className={clsx("site-mobile-nav__link", privacyPolicyActive && "is-active")}
                  prefetch={false}
                  onClick={go}
                >
                  {t("privacyPolicy")}
                </Link>
                <Link
                  href="/contact/"
                  className={clsx("site-mobile-nav__link", contactActive && "is-active")}
                  prefetch={false}
                  onClick={go}
                >
                  {t("contact")}
                </Link>

                <div className="site-mobile-nav__divider" role="separator" />

                <p className="site-mobile-nav__heading">{t("language")}</p>
                <div className="site-mobile-nav__langs">
                  {routing.locales.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={clsx(
                        "site-mobile-nav__lang",
                        item === locale && "is-active",
                      )}
                      aria-pressed={item === locale}
                      onClick={() => selectLocale(item)}
                    >
                      {tLang(item)}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="site-mobile-nav__action"
                  disabled={busy}
                  onClick={() => {
                    void handleShare();
                    close();
                  }}
                >
                  {copied ? (
                    <Check size={16} strokeWidth={2} aria-hidden />
                  ) : (
                    <Share2 size={16} strokeWidth={2} aria-hidden />
                  )}
                  <span>{copied ? tShare("linkCopied") : tShare("share")}</span>
                </button>

                {installVisible && installPrompt ? (
                  <button
                    type="button"
                    className="site-mobile-nav__action"
                    onClick={() => void onInstall()}
                  >
                    <Download size={16} strokeWidth={2} aria-hidden />
                    <span>{t("installApp")}</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="site-header__mobile-menu">
      <button
        type="button"
        className="site-header__menu-btn"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
      >
        <span className="site-header__menu-icon" aria-hidden />
      </button>
      {drawer}
    </div>
  );
}
