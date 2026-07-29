"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getInventoryToolsByCategory,
  listDedicatedInventoryHubLinks,
} from "@/lib/tools-inventory-query";

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

const PANEL_WIDTH = 420;
const VIEWPORT_MARGIN = 12;

function getPanelPosition(trigger: HTMLElement): PanelPosition {
  const rect = trigger.getBoundingClientRect();
  const isRtl = document.documentElement.dir === "rtl";
  const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  const top = rect.bottom + 8;

  if (isRtl) {
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN),
    );
    return { top, left, width };
  }

  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN),
  );
  return { top, left, width };
}

/**
 * Header "Tools" button + simple black dropdown menu (2 columns of categories).
 * Does not dim or lock the page — just opens under the trigger.
 */
export function HeaderCategoryHub() {
  const tHeader = useTranslations("Header");
  const tHome = useTranslations("Home");
  const tDir = useTranslations("ToolsDirectory");
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);

  const categories = useMemo(() => {
    return listDedicatedInventoryHubLinks().map((category) => ({
      ...category,
      toolCount: getInventoryToolsByCategory(category.id).length,
    }));
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

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
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open, close]);

  const resolveTitle = (id: InventoryCategoryId, fallback: string) => {
    const key = `landing.categoryTitles.${id}`;
    return tHome.has(key) ? tHome(key) : fallback;
  };

  return (
    <div className="tools-hub-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="site-header__nav-link site-header__tools-hub"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
      >
        <LayoutGrid className="site-header__nav-icon" aria-hidden size={14} strokeWidth={2} />
        <span className="site-header__tools-hub-label">{tHeader("toolsHub")}</span>
      </button>

      {mounted && open && panelPosition
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              className="tools-hub-menu__panel"
              role="menu"
              aria-label={tHome("landing.categoriesTitle")}
              style={{
                top: panelPosition.top,
                left: panelPosition.left,
                width: panelPosition.width,
              }}
            >
              <ul className="tools-hub-menu__list">
                {categories.map((category) => (
                  <li key={category.id} className="tools-hub-menu__item" role="none">
                    <Link
                      href={category.href}
                      className="tools-hub-menu__link"
                      role="menuitem"
                      prefetch={false}
                      onClick={close}
                    >
                      <span className="tools-hub-menu__link-title">
                        {resolveTitle(category.id as InventoryCategoryId, category.title)}
                      </span>
                      {category.toolCount > 0 ? (
                        <span className="tools-hub-menu__link-count">
                          {category.toolCount === 1
                            ? tDir("toolCount", { count: category.toolCount })
                            : tDir("toolCountPlural", { count: category.toolCount })}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
