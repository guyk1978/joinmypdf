"use client";

import {
  Check,
  Download,
  FolderKanban,
  MoreHorizontal,
  Share2,
  Bookmark,
} from "lucide-react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePageShare } from "@/hooks/usePageShare";
import { buildHeaderNavDropdowns } from "@/lib/header-nav";
import { isNavItemActive } from "@/lib/nav-config";
import { routing, type AppLocale } from "@/i18n/routing";

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

const PANEL_WIDTH = 240;
const VIEWPORT_MARGIN = 12;

function getPanelPosition(trigger: HTMLElement): PanelPosition {
  const rect = trigger.getBoundingClientRect();
  const isRtl = document.documentElement.dir === "rtl";
  const width = PANEL_WIDTH;
  const top = rect.bottom + 6;

  if (isRtl) {
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN));
    return { top, left, width };
  }

  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rect.right - width, window.innerWidth - width - VIEWPORT_MARGIN),
  );
  return { top, left, width };
}

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
  const tShare = useTranslations("Share");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { handleShare, copied, busy } = usePageShare();

  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installVisible, setInstallVisible] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const favoritesActive = pathname.includes("/favorites");
  const projectsActive = pathname.includes("/projects");
  const headerNavDropdowns = buildHeaderNavDropdowns((key) => t(key as "nav.image"));

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPanelPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;
      setPanelPosition(getPanelPosition(triggerRef.current));
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

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
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
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

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && triggerRef.current) {
        setPanelPosition(getPanelPosition(triggerRef.current));
      } else if (!next) {
        setPanelPosition(null);
      }
      return next;
    });
  };

  const itemClass = "site-header__overflow-item";

  const panel =
    open && panelPosition ? (
      <div
        ref={panelRef}
        id={panelId}
        className="site-header__overflow-panel site-header__overflow-panel--floating"
        role="menu"
        style={{
          top: panelPosition.top,
          left: panelPosition.left,
          width: panelPosition.width,
        }}
      >
          {showNavLinks ? (
            <>
              {headerNavDropdowns.map((dropdown, index) => (
                <div key={dropdown.id}>
                  {index > 0 ? <div className="site-header__overflow-divider" role="separator" /> : null}
                  <p className="site-header__overflow-heading">{dropdown.label}</p>
                  {dropdown.sections?.length
                    ? dropdown.sections.map((section) => (
                        <div key={section.id}>
                          <p className="site-header__overflow-subheading">{section.label}</p>
                          {section.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              className={clsx(itemClass, isNavItemActive(pathname, item.href) && "is-active")}
                              prefetch={false}
                              onClick={() => {
                                onNavigate?.();
                                close();
                              }}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      ))
                    : (dropdown.items ?? []).map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          className={clsx(itemClass, isNavItemActive(pathname, item.href) && "is-active")}
                          prefetch={false}
                          onClick={() => {
                            onNavigate?.();
                            close();
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                </div>
              ))}
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
            <Bookmark className="site-header__overflow-icon" strokeWidth={2} aria-hidden />
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
    ) : null;

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      <button
        ref={triggerRef}
        type="button"
        className="site-header__overflow-trigger"
        aria-label={t("moreMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={toggleOpen}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
