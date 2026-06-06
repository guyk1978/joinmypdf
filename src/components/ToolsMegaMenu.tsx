"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { ToolMegaGrid } from "@/components/ToolMegaGrid";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { flattenMegaMenuSections, type MegaMenuSection } from "@/lib/mega-menu";
import { isNavItemActive } from "@/lib/nav-config";

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

  const items = useMemo(
    () =>
      flattenMegaMenuSections(sections).map((item) => ({
        href: item.href,
        label: translateToolItem(tTools, item.slug, item.label),
        slugHint: item.slug,
      })),
    [sections, tTools],
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
        className="fixed inset-0 z-[60] w-screen overflow-y-auto bg-white dark:bg-neutral-950"
      >
        <button
          type="button"
          className="fixed top-4 end-4 z-[70] rounded-none border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          onClick={close}
        >
          {tHeader("closeToolsGrid")}
        </button>

        <div className="w-full pt-14">
          <div className="w-full border-b border-neutral-300 px-4 py-3 dark:border-neutral-700">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-black dark:text-neutral-200">
              {tHeader("allTools")}
            </p>
          </div>

          <ToolMegaGrid items={items} onNavigate={handleNavigate} />

          <div className="w-full border-t border-neutral-300 px-4 py-3 dark:border-neutral-700">
            <Link
              href="/tools/"
              prefetch={false}
              className="inline-flex items-center gap-1 text-sm font-semibold text-black hover:underline dark:text-neutral-200"
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
