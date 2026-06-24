"use client";

import {
  BookOpen,
  Check,
  Download,
  FolderKanban,
  LayoutGrid,
  Moon,
  MoreHorizontal,
  Share2,
  Shield,
  Star,
  Sun,
} from "lucide-react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePageShare } from "@/hooks/usePageShare";
import { isNavItemActive } from "@/lib/nav-config";
import { routing, type AppLocale } from "@/i18n/routing";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

type HeaderOverflowMenuProps = {
  showNavLinks?: boolean;
  onNavigate?: () => void;
};

export function HeaderOverflowMenu({ showNavLinks = false, onNavigate }: HeaderOverflowMenuProps) {
  const t = useTranslations("Header");
  const tLang = useTranslations("LanguageSwitcher");
  const tTheme = useTranslations("Theme");
  const tShare = useTranslations("Share");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { handleShare, copied, busy } = usePageShare();

  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installVisible, setInstallVisible] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const isDark = theme === "dark";
  const guidesActive = isNavItemActive(pathname, "/blog/");
  const toolsActive = (pathname.endsWith("/") ? pathname : `${pathname}/`) === "/tools/";
  const privacyActive = isNavItemActive(pathname, "/privacy-first/");
  const favoritesActive = pathname.includes("/favorites");
  const projectsActive = pathname.includes("/projects");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallVisible(true);
    };

    const onAppInstalled = () => {
      setInstallPrompt(null);
      setInstallVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const selectLocale = (nextLocale: AppLocale) => {
    if (!routing.locales.includes(nextLocale) || nextLocale === locale) {
      close();
      return;
    }
    router.replace(pathname, { locale: nextLocale });
    onNavigate?.();
    close();
  };

  const onInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome === "accepted") setInstallVisible(false);
    close();
  };

  const itemClass = "site-header__overflow-item";

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      <button
        type="button"
        className="site-header__overflow-trigger"
        aria-label={t("moreMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div id={panelId} className="site-header__overflow-panel" role="menu">
          {showNavLinks ? (
            <>
              <Link
                href="/tools/"
                role="menuitem"
                className={clsx(itemClass, toolsActive && "is-active")}
                prefetch={false}
                onClick={() => {
                  onNavigate?.();
                  close();
                }}
              >
                <LayoutGrid className="site-header__overflow-icon" aria-hidden />
                {t("allTools")}
              </Link>
              <Link
                href="/blog/"
                role="menuitem"
                className={clsx(itemClass, guidesActive && "is-active")}
                prefetch={false}
                onClick={() => {
                  onNavigate?.();
                  close();
                }}
              >
                <BookOpen className="site-header__overflow-icon" aria-hidden />
                {t("guides")}
              </Link>
              <Link
                href="/privacy-first/"
                role="menuitem"
                className={clsx(itemClass, "site-header__overflow-item--privacy", privacyActive && "is-active")}
                prefetch={false}
                onClick={() => {
                  onNavigate?.();
                  close();
                }}
              >
                <Shield className="site-header__overflow-icon" aria-hidden />
                {t("privacyFirst")}
              </Link>
              <div className="site-header__overflow-divider" role="separator" />
            </>
          ) : null}

          {routing.locales.map((item) => (
            <button
              key={item}
              type="button"
              role="menuitemradio"
              aria-checked={item === locale}
              className={clsx(itemClass, item === locale && "is-active")}
              onClick={() => selectLocale(item)}
            >
              {t("language")}: {tLang(item)}
            </button>
          ))}

          <div className="site-header__overflow-divider" role="separator" />

          {mounted ? (
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setTheme(isDark ? "light" : "dark");
                close();
              }}
            >
              {isDark ? (
                <Sun className="site-header__overflow-icon" aria-hidden />
              ) : (
                <Moon className="site-header__overflow-icon" aria-hidden />
              )}
              {isDark ? tTheme("switchToLight") : tTheme("switchToDark")}
            </button>
          ) : null}

          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={busy}
            onClick={() => {
              void handleShare();
              close();
            }}
          >
            {copied ? (
              <Check className="site-header__overflow-icon" aria-hidden />
            ) : (
              <Share2 className="site-header__overflow-icon" aria-hidden />
            )}
            {copied ? tShare("linkCopied") : tShare("share")}
          </button>

          <Link
            href="/favorites/"
            role="menuitem"
            className={clsx(itemClass, favoritesActive && "is-active")}
            prefetch={false}
            onClick={() => {
              onNavigate?.();
              close();
            }}
          >
            <Star className="site-header__overflow-icon" aria-hidden />
            {t("favorites")}
          </Link>

          <Link
            href="/projects/"
            role="menuitem"
            className={clsx(itemClass, projectsActive && "is-active")}
            prefetch={false}
            onClick={() => {
              onNavigate?.();
              close();
            }}
          >
            <FolderKanban className="site-header__overflow-icon" aria-hidden />
            {t("projects")}
          </Link>

          {installVisible && installPrompt ? (
            <button type="button" role="menuitem" className={itemClass} onClick={() => void onInstall()}>
              <Download className="site-header__overflow-icon" aria-hidden />
              {t("installApp")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
