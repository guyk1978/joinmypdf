"use client";

import {
  Check,
  Download,
  MoreHorizontal,
  Share2,
  BookOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePageShare } from "@/hooks/usePageShare";
import { routing, type AppLocale } from "@/i18n/routing";

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

const PANEL_WIDTH = 292;
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
  onNavigate?: () => void;
};

export function HeaderOverflowMenu({ onNavigate }: HeaderOverflowMenuProps) {
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
  const blogActive = pathname.includes("/blog");
  const aboutActive = pathname.includes("/about");
  const termsActive = pathname.includes("/terms");
  const privacyPolicyActive = pathname.includes("/privacy-policy");
  const contactActive = pathname.includes("/contact");
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
            href="/blog/"
            role="menuitem"
            className={clsx(itemClass, blogActive && "is-active")}
            prefetch={false}
            onClick={() => {
              onNavigate?.();
              close();
            }}
          >
            <BookOpen className="site-header__overflow-icon" aria-hidden />
            {t("blog")}
          </Link>

          <div className="site-header__overflow-divider" role="separator" />

          <p className="site-header__overflow-heading">{t("siteLabel")}</p>

          <Link
            href="/about/"
            role="menuitem"
            className={clsx(itemClass, aboutActive && "is-active")}
            prefetch={false}
            onClick={() => {
              onNavigate?.();
              close();
            }}
          >
            {t("about")}
          </Link>

          <Link
            href="/terms/"
            role="menuitem"
            className={clsx(itemClass, termsActive && "is-active")}
            prefetch={false}
            onClick={() => {
              onNavigate?.();
              close();
            }}
          >
            {t("termsOfService")}
          </Link>

          <Link
            href="/privacy-policy/"
            role="menuitem"
            className={clsx(itemClass, privacyPolicyActive && "is-active")}
            prefetch={false}
            onClick={() => {
              onNavigate?.();
              close();
            }}
          >
            {t("privacyPolicy")}
          </Link>

          <Link
            href="/contact/"
            role="menuitem"
            className={clsx(itemClass, contactActive && "is-active")}
            prefetch={false}
            onClick={() => {
              onNavigate?.();
              close();
            }}
          >
            {t("contact")}
          </Link>

          {process.env.NEXT_PUBLIC_ADMIN_INVENTORY === "true" ? (
            <>
              <div className="site-header__overflow-divider" role="separator" />
              <Link
                href="/admin/inventory/"
                role="menuitem"
                className={clsx(itemClass, pathname.includes("/admin/inventory") && "is-active")}
                prefetch={false}
                onClick={() => {
                  onNavigate?.();
                  close();
                }}
              >
                {t("siteInventory")}
              </Link>
            </>
          ) : null}

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
