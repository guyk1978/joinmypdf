"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  FileText,
  Heart,
  Link2,
  MessageSquare,
  Save,
  Share2,
  Upload,
  X,
} from "lucide-react";
import { useOptionalToolModal, EMPTY_TOOL_MODAL_ACTIONS } from "@/components/tool-modal/tool-modal-context";
import type { ToolModalTab } from "@/components/tool-modal/tool-modal-session-context";
import { scrollToWorkspaceUpload, WORKSPACE_SET_TAB_EVENT } from "@/lib/workspace-flow";
import { requestToolModalTab } from "@/lib/tool-modal-tab-bus";

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

const PANEL_WIDTH = 280;
const VIEWPORT_MARGIN = 12;

function getPanelPosition(trigger: HTMLElement): PanelPosition {
  const rect = trigger.getBoundingClientRect();
  const isRtl = document.documentElement.dir === "rtl";
  const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  const top = rect.bottom + 8;

  if (isRtl) {
    return {
      top,
      left: Math.max(
        VIEWPORT_MARGIN,
        Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN),
      ),
      width,
    };
  }

  return {
    top,
    left: Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.right - width, window.innerWidth - width - VIEWPORT_MARGIN),
    ),
    width,
  };
}

/**
 * Header "OPERATION" dropdown — visible only on active tool pages.
 * Each item calls the same ToolModalWrapper handlers the old sidebar used.
 */
export function HeaderOperationsMenu() {
  const tHeader = useTranslations("Header");
  const tModal = useTranslations("ToolModal");
  const toolModal = useOptionalToolModal();
  const isToolPage = Boolean(toolModal?.isOpen);
  const session = toolModal?.session ?? null;
  const actions = toolModal?.actions;

  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggle = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen((prev) => !prev);
  }, []);

  const goTab = useCallback(
    (next: ToolModalTab) => {
      setOpen(false);

      const bridgeSetTab = toolModal?.actions?.setTab;
      if (
        typeof bridgeSetTab === "function" &&
        bridgeSetTab !== EMPTY_TOOL_MODAL_ACTIONS.setTab
      ) {
        bridgeSetTab(next);
      }

      requestToolModalTab(next);
      toolModal?.session?.setTab?.(next);

      window.dispatchEvent(
        new CustomEvent(WORKSPACE_SET_TAB_EVENT, { detail: { tab: next } }),
      );
      window.requestAnimationFrame(() => {
        requestToolModalTab(next);
        toolModal?.actions?.setTab?.(next);
      });

      if (next === "calc") {
        scrollToWorkspaceUpload();
        try {
          for (let i = 0; i < window.frames.length; i += 1) {
            window.frames[i]?.postMessage(
              { type: "joinmypdf:focus-workspace-upload" },
              "*",
            );
          }
        } catch {
          /* ignore cross-origin */
        }
      }
    },
    [toolModal],
  );

  const invoke = useCallback((action?: (() => void) | null) => {
    setOpen(false);
    if (typeof action !== "function") return;
    action();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isToolPage) setOpen(false);
  }, [isToolPage]);

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
      if (event.key === "Escape") closeMenu();
    };

    const onPointerDown = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closeMenu();
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("touchstart", onPointerDown);
    }, 0);

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open, closeMenu]);

  if (!isToolPage) return null;

  const operationLabel = tHeader.has("operations") ? tHeader("operations") : "OPERATION";
  const returnLabel = tHeader.has("returnToMainView")
    ? tHeader("returnToMainView")
    : "Return to Upload";
  const favoriteLabel = session?.favorited
    ? session.favoriteLabel ||
      (tModal.has("removeFavorite") ? tModal("removeFavorite") : "Remove from Favorites")
    : session?.favoriteLabel ||
      (tModal.has("addFavorite") ? tModal("addFavorite") : "Add to Favorites");
  const docsLabel = tModal.has("doc") ? tModal("doc") : "Documents";
  const relatedLabel = tModal.has("related") ? tModal("related") : "Related Tools";
  const reviewsLabel = tModal.has("reviews") ? tModal("reviews") : "Reviews";
  const saveLabel = tModal.has("saveProject") ? tModal("saveProject") : "Save Project";
  const shareLabel = tModal.has("share") ? tModal("share") : "Share";
  const closeLabel = tModal.has("close") ? tModal("close") : "Close Tool";

  const panel =
    mounted && open && panelPosition
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            className="operations-menu__panel"
            role="menu"
            aria-label={operationLabel}
            style={{
              top: panelPosition.top,
              left: panelPosition.left,
              width: panelPosition.width,
            }}
          >
            <ul className="operations-menu__list">
              <li role="none">
                <button
                  type="button"
                  className={
                    session?.tab === "calc"
                      ? "operations-menu__item operations-menu__item--active"
                      : "operations-menu__item"
                  }
                  role="menuitem"
                  onClick={() => goTab("calc")}
                >
                  <Upload size={15} strokeWidth={2} aria-hidden />
                  <span>{returnLabel}</span>
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  className={
                    session?.tab === "doc"
                      ? "operations-menu__item operations-menu__item--active"
                      : "operations-menu__item"
                  }
                  role="menuitem"
                  onClick={() => goTab("doc")}
                >
                  <FileText size={15} strokeWidth={2} aria-hidden />
                  <span>{docsLabel}</span>
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  className={
                    session?.tab === "related"
                      ? "operations-menu__item operations-menu__item--active"
                      : "operations-menu__item"
                  }
                  role="menuitem"
                  onClick={() => goTab("related")}
                >
                  <Link2 size={15} strokeWidth={2} aria-hidden />
                  <span>{relatedLabel}</span>
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  className={
                    session?.tab === "reviews"
                      ? "operations-menu__item operations-menu__item--active"
                      : "operations-menu__item"
                  }
                  role="menuitem"
                  onClick={() => goTab("reviews")}
                >
                  <MessageSquare size={15} strokeWidth={2} aria-hidden />
                  <span>{reviewsLabel}</span>
                </button>
              </li>
            </ul>

            <div className="operations-menu__divider" role="separator" />

            <ul className="operations-menu__list">
              <li role="none">
                <button
                  type="button"
                  className={
                    session?.favorited
                      ? "operations-menu__item operations-menu__item--active"
                      : "operations-menu__item"
                  }
                  role="menuitem"
                  disabled={!session?.slug}
                  onClick={() =>
                    invoke(() => (session?.toggleFavorite ?? actions?.toggleFavorite)?.())
                  }
                >
                  <Heart
                    size={15}
                    strokeWidth={2}
                    className={session?.favorited ? "fill-current" : undefined}
                    aria-hidden
                  />
                  <span>{favoriteLabel}</span>
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  className="operations-menu__item"
                  role="menuitem"
                  disabled={!session?.canSaveProject}
                  onClick={() => {
                    if (!session?.canSaveProject) return;
                    invoke(() => (session?.saveProject ?? actions?.saveProject)?.());
                  }}
                >
                  <Save size={15} strokeWidth={2.25} aria-hidden />
                  <span>{saveLabel}</span>
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  className="operations-menu__item"
                  role="menuitem"
                  disabled={Boolean(session?.shareBusy)}
                  onClick={() => invoke(() => (session?.share ?? actions?.share)?.())}
                >
                  <Share2 size={15} strokeWidth={2} aria-hidden />
                  <span>{shareLabel}</span>
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  className="operations-menu__item operations-menu__item--danger"
                  role="menuitem"
                  onClick={() =>
                    invoke(() => {
                      const close = session?.close ?? actions?.close;
                      if (close) close();
                      else toolModal?.closeToolModal();
                    })
                  }
                >
                  <X size={15} strokeWidth={2.25} aria-hidden />
                  <span>{closeLabel}</span>
                </button>
              </li>
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="operations-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="site-header__nav-link site-header__operations"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
      >
        <span className="site-header__operations-label">{operationLabel}</span>
        <ChevronDown
          className={
            open
              ? "site-header__nav-icon site-header__operations-chevron site-header__operations-chevron--open"
              : "site-header__nav-icon site-header__operations-chevron"
          }
          aria-hidden
          size={14}
          strokeWidth={2.25}
        />
      </button>
      {panel}
    </div>
  );
}
