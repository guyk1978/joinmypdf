"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ToolIconBadge } from "@/lib/tool-icons";
import { translateToolItem, translateToolSection } from "@/lib/i18n-tool-labels";
import type { MegaMenuSection } from "@/lib/mega-menu";
import { isNavItemActive } from "@/lib/nav-config";

const OPEN_DELAY_MS = 80;
const CLOSE_DELAY_MS = 280;

function LayoutGridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function NavChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={clsx("nav-mega__chevron transition-transform duration-200", open && "rotate-180")}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ToolsMegaMenuProps = {
  sections: MegaMenuSection[];
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export function ToolsMegaMenu({
  sections,
  onNavigate,
  variant = "desktop",
}: ToolsMegaMenuProps) {
  const tHeader = useTranslations("Header");
  const tTools = useTranslations("Tools");
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = variant === "mobile";

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    openTimerRef.current = null;
    closeTimerRef.current = null;
  }, []);

  const close = useCallback(() => {
    clearTimers();
    setOpen(false);
  }, [clearTimers]);

  const scheduleOpen = useCallback(() => {
    if (isMobile) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      setOpen(true);
    }, OPEN_DELAY_MS);
  }, [isMobile, clearTimers]);

  const scheduleClose = useCallback(() => {
    if (isMobile) return;
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
    }, CLOSE_DELAY_MS);
  }, [isMobile, clearTimers]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open || isMobile) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isMobile, close]);

  const isToolsActive = sections.some((section) =>
    section.items.some((item) => isNavItemActive(pathname, item.href)),
  );

  return (
    <div
      ref={rootRef}
      className="static"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={clsx(
          "nav-mega__trigger inline-flex items-center gap-1.5",
          isMobile && "w-full justify-center",
          isToolsActive && "nav-mega__trigger--active",
        )}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => {
          clearTimers();
          setOpen((prev) => !prev);
        }}
      >
        <LayoutGridIcon className="nav-mega__trigger-icon shrink-0" />
        <span>{tHeader("allTools")}</span>
        <NavChevron open={open} />
      </button>

      <div
        role="menu"
        className={clsx(
          "z-[60] transition-[opacity,visibility,transform] duration-200 ease-out",
          isMobile
            ? "relative mt-2 w-full"
            : "fixed left-1/2 top-12 z-[60] mx-auto w-screen max-w-5xl -translate-x-1/2 px-3 pt-1",
          open
            ? "visible translate-y-0 opacity-100 pointer-events-auto"
            : "invisible -translate-y-1 opacity-0 pointer-events-none",
        )}
      >
        <div className="nav-mega__panel overflow-hidden rounded-none border border-neutral-300 dark:border-neutral-800">
          <div className="nav-mega__grid">
            {sections.map((section) => {
              const sectionLabel = translateToolSection(tTools, section.id, section.label);
              return (
              <div key={section.id} className="nav-mega__column min-w-0">
                <p className="nav-mega__heading">{sectionLabel}</p>
                <ul className="nav-mega__list">
                  {section.items.map((item) => {
                    const itemLabel = translateToolItem(tTools, item.slug, item.label);
                    return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={clsx(
                          "nav-mega__link",
                          isNavItemActive(pathname, item.href) && "is-active",
                        )}
                        role="menuitem"
                        prefetch={false}
                        onClick={() => {
                          close();
                          onNavigate?.();
                        }}
                      >
                        <ToolIconBadge slug={item.slug} label={itemLabel} size="sm" />
                        <span className="nav-mega__link-label">{itemLabel}</span>
                      </Link>
                    </li>
                  );})}
                </ul>
              </div>
            );})}
          </div>
          <div className="nav-mega__footer">
            <Link
              href="/tools/"
              className="nav-mega__footer-link"
              prefetch={false}
              onClick={() => {
                close();
                onNavigate?.();
              }}
            >
              {tHeader("viewAllTools")} {locale === "he" ? "←" : "→"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
