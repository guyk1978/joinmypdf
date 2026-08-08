"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  buildInventoryGridItems,
  getInventoryToolsByCategory,
  listDedicatedInventoryHubLinks,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import { useOptionalToolModal } from "@/components/tool-modal/tool-modal-context";

/** Shared industrial accent for the Tools mega menu (no rainbow category fills). */
const TOOLS_HUB_ACCENT = "#34d399";
const TOOLS_HUB_PANEL_STYLE = {
  ["--tools-hub-accent"]: TOOLS_HUB_ACCENT,
} as CSSProperties;

type PanelPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

/** Wide mega-menu footprint — clamps to the viewport with side margins. */
const PANEL_MAX_WIDTH = 1120;
const VIEWPORT_MARGIN = 16;

function getPanelPosition(trigger: HTMLElement): PanelPosition {
  const rect = trigger.getBoundingClientRect();
  const isRtl = document.documentElement.dir === "rtl";
  const width = Math.min(PANEL_MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  const top = Math.min(rect.bottom + 10, window.innerHeight - 120);
  const maxHeight = Math.max(240, window.innerHeight - top - VIEWPORT_MARGIN);

  // Prefer aligning under the trigger; if the panel is wider, pin to the
  // nearest viewport edge so the mega menu stays fully visible.
  let left: number;
  if (isRtl) {
    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN),
    );
  } else {
    // Start near the trigger's left, then clamp.
    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN),
    );
    // If there's room, nudge toward header content center for a balanced mega menu.
    const ideal = Math.max(
      VIEWPORT_MARGIN,
      Math.min(
        (window.innerWidth - width) / 2,
        window.innerWidth - width - VIEWPORT_MARGIN,
      ),
    );
    // Prefer centering when the panel is much wider than the trigger cluster.
    if (width > 640) left = ideal;
  }

  return { top, left, width, maxHeight };
}

/**
 * Header "TOOLS" button + wide multi-column mega menu of categories and tools.
 */
export function HeaderCategoryHub() {
  const tHeader = useTranslations("Header");
  const tHome = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const tDir = useTranslations("ToolsDirectory");
  const locale = useLocale();
  const toolModal = useOptionalToolModal();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);

  const groups = useMemo(() => {
    const translate = tTools as InventoryTranslator;
    return listDedicatedInventoryHubLinks().map((category) => {
      const tools = buildInventoryGridItems(category.id, translate, locale);
      return {
        ...category,
        toolCount: getInventoryToolsByCategory(category.id).length,
        tools,
      };
    });
  }, [locale, tTools]);

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

    const onPointerDown = (event: Event) => {
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

  const navigateAway = (href: string, event: ReactMouseEvent) => {
    close();
    if (toolModal?.isOpen) {
      event.preventDefault();
      toolModal.closeToolModal({ href });
    }
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
              className="tools-hub-menu__panel tools-hub-menu__panel--tools tools-hub-menu__panel--mega"
              role="menu"
              aria-label={tHeader("toolsHub")}
              style={{
                top: panelPosition.top,
                left: panelPosition.left,
                width: panelPosition.width,
                maxHeight: panelPosition.maxHeight,
                ...TOOLS_HUB_PANEL_STYLE,
              }}
            >
              <div className="tools-hub-menu__panel-head">
                <p className="tools-hub-menu__eyebrow">{tHeader("browseTools")}</p>
                <p className="tools-hub-menu__panel-meta">
                  {tHeader.has("toolsHubMeta")
                    ? tHeader("toolsHubMeta")
                    : `${tDir("instantLocal")} · ${tDir("zeroUploads")}`}
                </p>
              </div>
              <div className="tools-hub-menu__groups">
                {groups.map((category) => (
                  <section key={category.id} className="tools-hub-menu__group">
                    <Link
                      href={category.href}
                      className="tools-hub-menu__group-title"
                      role="menuitem"
                      prefetch={false}
                      onClick={(event) => navigateAway(category.href, event)}
                    >
                      <span className="tools-hub-menu__group-title-text">
                        {resolveTitle(category.id as InventoryCategoryId, category.title)}
                      </span>
                      {category.toolCount > 0 ? (
                        <span className="tools-hub-menu__group-count">{category.toolCount}</span>
                      ) : null}
                    </Link>
                    {category.tools.length > 0 ? (
                      <ul className="tools-hub-menu__tool-list">
                        {category.tools.map((tool) => (
                          <li key={tool.slugHint ?? tool.href} role="none">
                            <Link
                              href={tool.href}
                              className="tools-hub-menu__tool-link"
                              role="menuitem"
                              prefetch={false}
                              onClick={(event) => navigateAway(tool.href, event)}
                            >
                              {tool.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
