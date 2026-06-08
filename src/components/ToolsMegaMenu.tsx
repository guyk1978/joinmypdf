"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { ToolMegaGrid } from "@/components/ToolMegaGrid";
import { translateToolItem, translateToolGridCategory } from "@/lib/i18n-tool-labels";
import { buildToolMegaGridGroups, type MegaMenuSection } from "@/lib/mega-menu";
import { isNavItemActive } from "@/lib/nav-config";
import { OPEN_TOOLS_GRID_EVENT } from "@/lib/tool-grid-events";

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
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

type ToolsMegaMenuProps = {
  sections: MegaMenuSection[];
  onNavigate?: () => void;
  className?: string;
};

export function ToolsMegaMenu({ sections, onNavigate, className }: ToolsMegaMenuProps) {
  const tHeader = useTranslations("Header");
  const tTools = useTranslations("Tools");
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const groups = useMemo(
    () =>
      buildToolMegaGridGroups().map((group) => ({
        id: group.id,
        label: translateToolGridCategory(tTools, group.id),
        items: group.items.map((item) => ({
          href: item.href,
          label: translateToolItem(tTools, item.slug, item.label),
          slugHint: item.slug,
        })),
      })),
    [tTools],
  );

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) onNavigate?.();
      return next;
    });
  }, [onNavigate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    document.body.classList.toggle("site-tools-grid-open", open);
    return () => document.body.classList.remove("site-tools-grid-open");
  }, [open]);

  useEffect(() => {
    const openGrid = () => setOpen(true);
    window.addEventListener(OPEN_TOOLS_GRID_EVENT, openGrid);
    return () => window.removeEventListener(OPEN_TOOLS_GRID_EVENT, openGrid);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const isToolsActive =
    open ||
    sections.some((section) => section.items.some((item) => isNavItemActive(pathname, item.href)));

  const handleNavigate = () => {
    close();
    onNavigate?.();
  };

  const overlay =
    open && mounted ? (
      <div
        id="tool-mega-grid-panel"
        role="dialog"
        aria-modal="true"
        aria-label={tHeader("allTools")}
        className="tool-mega-overlay fixed top-12 bottom-0 left-0 right-0 z-40 flex w-full min-h-[calc(100dvh-3rem)] flex-col bg-white/95 backdrop-blur-xl dark:bg-neutral-900/95 md:max-h-[calc(100dvh-3rem)] md:overflow-hidden"
      >
        <div className="relative w-full shrink-0 border-b border-neutral-200/80 px-4 py-2.5 dark:border-white/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
            {tHeader("allTools")}
          </p>
          <button
            type="button"
            className="absolute top-1/2 end-4 -translate-y-1/2 rounded-md border border-neutral-300/80 bg-transparent px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-neutral-800"
            onClick={close}
          >
            {tHeader("closeToolsGrid")}
          </button>
        </div>

        <div className="w-full flex-1 overflow-y-auto overscroll-y-contain md:min-h-0">
          <ToolMegaGrid groups={groups} onNavigate={handleNavigate} />

          <div className="w-full border-t border-neutral-200/80 px-4 py-2.5 dark:border-white/5">
            <Link
              href="/tools/"
              prefetch={false}
              className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 hover:underline dark:text-neutral-300"
              onClick={handleNavigate}
            >
              {tHeader("viewAllTools")} {locale === "he" ? "←" : "→"}
            </Link>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        className={clsx(
          "nav-mega__trigger inline-flex items-center gap-1.5",
          className,
          isToolsActive && "nav-mega__trigger--active",
        )}
        aria-expanded={open}
        aria-controls="tool-mega-grid-panel"
        onClick={toggle}
      >
        <LayoutGridIcon className="nav-mega__trigger-icon shrink-0" />
        <span>{tHeader("allTools")}</span>
      </button>

      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
