"use client";

import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pin, Search, Share2, Star, X, ZoomIn } from "lucide-react";
import { clsx } from "clsx";
import { createPortal } from "react-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { usePinnedTools } from "@/hooks/usePinnedTools";
import { usePageShare } from "@/hooks/usePageShare";
import { recordRecentTool } from "@/lib/recent-activity";
import {
  getMagnifierPreference,
  getMagnifierSizeTier,
  MAGNIFIER_SIZE_TIERS,
  setMagnifierPreference,
  setMagnifierSizeTier,
  subscribeMagnifierPreference,
  subscribeMagnifierSizeTier,
  type MagnifierSizeTier,
} from "@/lib/magnifier-preference";
import { requestPreviewInspect } from "@/lib/preview-inspect";
import { ToolModalRating } from "@/components/tool-modal/ToolModalRating";
import {
  getCategoryAccentCssVar,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import {
  WORKSPACE_PHASE_MESSAGE,
  type WorkspacePhase,
} from "@/lib/workspace-flow";
import { TOOL_INTRO_MESSAGE } from "@/lib/tool-intro-chrome";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

export type ToolModalTab = "calc" | "doc" | "related";

export type ToolModalWrapperProps = {
  open: boolean;
  title: string;
  /** Short description included in Web Share payload. */
  description?: string;
  /** Tool id used for favorites toggle. */
  slug?: string;
  /** Inventory category for accent theming — resolved from slug when omitted. */
  categoryId?: InventoryCategoryId;
  onClose: () => void;
  onExitComplete?: () => void;
  /** CALC tab — tool UI (iframe, calculator, workspace). */
  calc: ReactNode;
  /** DOC tab — documentation / formulas / explanation. */
  docs?: ReactNode;
  /** RELATED tab — similar tools + articles. */
  related?: ReactNode;
  defaultTab?: ToolModalTab;
  /** True once the CALC surface (e.g. iframe) has finished mounting. */
  contentReady?: boolean;
  labels?: {
    calc?: string;
    doc?: string;
    related?: string;
    close?: string;
    loading?: string;
    addFavorite?: string;
    removeFavorite?: string;
    ratings?: string;
    thankYou?: string;
    rateAria?: string;
    yourRatingAria?: string;
    viewsNav?: string;
    showMagnifier?: string;
    hideMagnifier?: string;
    inspectPreview?: string;
    magnifierSizeGroup?: string;
    magnifierSizeOff?: string;
    magnifierSizeSmall?: string;
    magnifierSizeMedium?: string;
    magnifierSizeHuge?: string;
    pin?: string;
    unpin?: string;
  };
  className?: string;
};

/**
 * Global JoinMyPDF tool modal shell (Industrial Matte).
 * Always opens at maximum width. Site header stays visible during the clean
 * upload phase, but cinematic intro splashes hide it for true fullscreen
 * isolation until Get Started. After file upload the tool action bar
 * replaces the site chrome.
 */
export function ToolModalWrapper({
  open,
  title,
  description,
  slug,
  categoryId: categoryIdProp,
  onClose,
  onExitComplete,
  calc,
  docs,
  related,
  defaultTab = "calc",
  contentReady = true,
  labels,
  className,
}: ToolModalWrapperProps) {
  const titleId = useId();
  const [tab, setTab] = useState<ToolModalTab>(defaultTab);
  const [workspacePhase, setWorkspacePhase] = useState<WorkspacePhase>("clean");
  /** True once a PDF (or other upload) has entered the active workspace. */
  const hasFileUploaded = workspacePhase === "active";
  /** Cinematic intro splash active inside the CALC iframe. */
  const [introActive, setIntroActive] = useState(false);
  const [loupeEnabled, setLoupeEnabled] = useState(true);
  const [loupeSize, setLoupeSize] = useState<MagnifierSizeTier>("medium");
  const [mounted, setMounted] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isPinned, pinTool } = usePinnedTools();
  const favorited = slug ? isFavorite(slug) : false;
  const pinned = slug ? isPinned(slug) : false;
  const sharePayload = useMemo(
    () => ({
      title,
      text: description?.trim() || undefined,
    }),
    [description, title],
  );
  const { handleShare, copied, busy: shareBusy, ariaLabel: shareAriaLabel, linkCopiedLabel } =
    usePageShare(sharePayload);
  const categoryId = categoryIdProp ?? resolveToolCategoryId(slug);
  const accentStyle = categoryId
    ? ({ "--category-accent": getCategoryAccentCssVar(categoryId) } as CSSProperties)
    : undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLoupeEnabled(getMagnifierPreference());
    setLoupeSize(getMagnifierSizeTier());
    const unsubEnabled = subscribeMagnifierPreference(setLoupeEnabled);
    const unsubSize = subscribeMagnifierSizeTier(setLoupeSize);
    return () => {
      unsubEnabled();
      unsubSize();
    };
  }, []);

  useEffect(() => {
    if (!open || !slug) return;
    // Chronological recent list only — full page shells already bump usage
    // counts via recordToolUsage, so we avoid double-counting here.
    recordRecentTool(slug);
  }, [open, slug]);

  useEffect(() => {
    if (!open) return;
    setTab(defaultTab);
    setWorkspacePhase("clean");
    setIntroActive(false);
  }, [open, defaultTab, title, slug]);

  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    const prevBodyPad = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbar > 0) {
      document.body.style.paddingRight = `${scrollbar}px`;
    }
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      document.body.style.paddingRight = prevBodyPad;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const applyPhase = (phase: WorkspacePhase) => {
      setWorkspacePhase(phase);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: string }).type;
      if (type === WORKSPACE_PHASE_MESSAGE) {
        const phase = (data as { phase?: string }).phase;
        if (phase === "clean" || phase === "active") applyPhase(phase);
        return;
      }
      if (type === TOOL_INTRO_MESSAGE) {
        setIntroActive(Boolean((data as { active?: boolean }).active));
      }
    };

    const onCustomPhase = (event: Event) => {
      const phase = (event as CustomEvent<{ phase?: WorkspacePhase }>).detail?.phase;
      if (phase === "clean" || phase === "active") applyPhase(phase);
    };

    const onCustomIntro = (event: Event) => {
      setIntroActive(Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active));
    };

    window.addEventListener("message", onMessage);
    window.addEventListener(WORKSPACE_PHASE_MESSAGE, onCustomPhase);
    window.addEventListener(TOOL_INTRO_MESSAGE, onCustomIntro);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener(WORKSPACE_PHASE_MESSAGE, onCustomPhase);
      window.removeEventListener(TOOL_INTRO_MESSAGE, onCustomIntro);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      document.documentElement.removeAttribute("data-tool-modal-workspace");
      document.documentElement.removeAttribute("data-tool-modal-fullscreen");
      document.documentElement.removeAttribute("data-tool-intro");
      return;
    }

    document.documentElement.setAttribute("data-tool-modal-open", "1");
    document.documentElement.setAttribute("data-tool-modal-workspace", workspacePhase);
    if (introActive) {
      document.documentElement.setAttribute("data-tool-intro", "1");
    } else {
      document.documentElement.removeAttribute("data-tool-intro");
    }
    // Mutual exclusion: active = tool toolbar only; clean = site header only
    // (unless cinematic intro owns the full viewport).
    if (hasFileUploaded) {
      document.documentElement.setAttribute("data-tool-modal-fullscreen", "1");
    } else {
      document.documentElement.removeAttribute("data-tool-modal-fullscreen");
    }

    return () => {
      document.documentElement.removeAttribute("data-tool-modal-workspace");
      document.documentElement.removeAttribute("data-tool-modal-fullscreen");
      document.documentElement.removeAttribute("data-tool-intro");
    };
  }, [open, workspacePhase, hasFileUploaded, introActive]);

  if (!mounted) return null;

  const calcLabel = labels?.calc ?? "CALC";
  const docLabel = labels?.doc ?? "DOC";
  const relatedLabel = labels?.related ?? "RELATED";
  const closeLabel = labels?.close ?? "Close";
  const loadingLabel = labels?.loading ?? "Loading tool…";
  const favoriteLabel = favorited
    ? (labels?.removeFavorite ?? "Remove from favorites")
    : (labels?.addFavorite ?? "Add to favorites");
  const loupeLabel = loupeEnabled
    ? (labels?.hideMagnifier ?? "Hide Magnifier")
    : (labels?.showMagnifier ?? "Show Magnifier");
  const inspectLabel = labels?.inspectPreview ?? "Inspect preview";
  const loupeSizeGroupLabel = labels?.magnifierSizeGroup ?? "Magnifier size";
  const loupeOffLabel = labels?.magnifierSizeOff ?? "Off";
  const loupeSizeLabels: Record<MagnifierSizeTier, string> = {
    small: labels?.magnifierSizeSmall ?? "Small",
    medium: labels?.magnifierSizeMedium ?? "Medium",
    huge: labels?.magnifierSizeHuge ?? "Huge",
  };
  const pinLabel = pinned
    ? (labels?.unpin ?? "Unpin from dock")
    : (labels?.pin ?? "Pin to dock");

  const panes: { id: ToolModalTab; content: ReactNode; scroll?: boolean }[] = [
    { id: "calc", content: calc },
    ...(docs != null ? [{ id: "doc" as const, content: docs, scroll: true }] : []),
    ...(related != null
      ? [{ id: "related" as const, content: related, scroll: true }]
      : []),
  ];

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <div
          className={clsx(
            "tool-modal",
            "tool-modal--fullscreen",
            !contentReady && "tool-modal--loading",
            className,
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-busy={!contentReady}
          data-fullscreen="1"
          data-workspace-phase={workspacePhase}
          data-has-file={hasFileUploaded ? "1" : "0"}
        >
          {/* Opaque veil first — masks any background page paint / flicker */}
          <motion.button
            type="button"
            className="tool-modal__backdrop"
            aria-label={closeLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={undefined}
            tabIndex={-1}
          />

          <motion.div
            className="tool-modal__panel tool-modal__panel--fullscreen"
            data-category={categoryId || undefined}
            style={accentStyle}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {hasFileUploaded ? (
            <header className="tool-modal__header">
              <h2 id={titleId} className="tool-modal__title">
                {title}
              </h2>

              <div className="tool-modal__header-end">
                <ToolModalRating
                  slug={slug}
                  categoryId={categoryId}
                  labels={{
                    ratings: labels?.ratings,
                    thankYou: labels?.thankYou,
                    rateAria: labels?.rateAria,
                    yourRatingAria: labels?.yourRatingAria,
                  }}
                />

                <nav className="tool-modal__tabs" aria-label={labels?.viewsNav ?? "Tool views"}>
                  {panes.map(({ id }) => {
                    const label =
                      id === "calc" ? calcLabel : id === "doc" ? docLabel : relatedLabel;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={clsx(
                          "tool-modal__tab",
                          tab === id && "tool-modal__tab--active",
                        )}
                        aria-pressed={tab === id}
                        onClick={() => setTab(id)}
                      >
                        [{label}]
                      </button>
                    );
                  })}
                </nav>

                <button
                  type="button"
                  className="tool-modal__action"
                  onClick={() => {
                    void handleShare();
                  }}
                  disabled={shareBusy}
                  aria-label={shareAriaLabel}
                >
                  <Share2 size={18} strokeWidth={2} aria-hidden />
                </button>

                {slug ? (
                  <button
                    type="button"
                    className={clsx(
                      "tool-modal__action",
                      pinned && "tool-modal__action--pinned",
                    )}
                    onClick={() => {
                      if (!pinned) pinTool(slug);
                      onClose();
                    }}
                    aria-label={pinLabel}
                    aria-pressed={pinned}
                    title={pinLabel}
                  >
                    <Pin
                      size={18}
                      strokeWidth={2}
                      className={clsx(pinned && "fill-current")}
                      aria-hidden
                    />
                  </button>
                ) : null}

                {slug ? (
                  <button
                    type="button"
                    className={clsx(
                      "tool-modal__action",
                      favorited && "tool-modal__action--favorite",
                    )}
                    onClick={() => toggleFavorite(slug)}
                    aria-label={favoriteLabel}
                    aria-pressed={favorited}
                  >
                    <Star
                      size={18}
                      strokeWidth={2}
                      className={clsx(favorited && "fill-current")}
                      aria-hidden
                    />
                  </button>
                ) : null}

                <div
                  className={clsx(
                    "tool-modal__loupe-cluster",
                    !loupeEnabled && "tool-modal__loupe-cluster--off",
                  )}
                >
                  <button
                    type="button"
                    className={clsx(
                      "tool-modal__action tool-modal__loupe",
                      !loupeEnabled && "tool-modal__loupe--off",
                    )}
                    onClick={() => setMagnifierPreference(!loupeEnabled)}
                    aria-label={loupeLabel}
                    aria-pressed={loupeEnabled}
                    title={loupeLabel}
                  >
                    <Search size={18} strokeWidth={2} aria-hidden />
                  </button>

                  <div
                    className="tool-modal__loupe-sizes"
                    role="group"
                    aria-label={loupeSizeGroupLabel}
                  >
                    <button
                      type="button"
                      className={clsx(
                        "tool-modal__loupe-size tool-modal__loupe-size--off",
                        !loupeEnabled && "tool-modal__loupe-size--active",
                      )}
                      aria-label={loupeOffLabel}
                      aria-pressed={!loupeEnabled}
                      title={loupeOffLabel}
                      onClick={() => setMagnifierPreference(false)}
                    >
                      <span className="tool-modal__loupe-size-dot" aria-hidden />
                      <span className="tool-modal__loupe-size-label">{loupeOffLabel}</span>
                    </button>
                    {MAGNIFIER_SIZE_TIERS.map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        className={clsx(
                          "tool-modal__loupe-size",
                          `tool-modal__loupe-size--${tier}`,
                          loupeEnabled && loupeSize === tier && "tool-modal__loupe-size--active",
                        )}
                        aria-label={loupeSizeLabels[tier]}
                        aria-pressed={loupeEnabled && loupeSize === tier}
                        title={loupeSizeLabels[tier]}
                        onClick={() => {
                          setMagnifierPreference(true);
                          setMagnifierSizeTier(tier);
                          setLoupeSize(tier);
                        }}
                      >
                        <span className="tool-modal__loupe-size-dot" aria-hidden />
                        <span className="tool-modal__loupe-size-label">
                          {loupeSizeLabels[tier]}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="tool-modal__action tool-modal__inspect"
                    onClick={() => requestPreviewInspect()}
                    aria-label={inspectLabel}
                    title={inspectLabel}
                  >
                    <ZoomIn size={18} strokeWidth={2} aria-hidden />
                  </button>
                </div>

                <button
                  type="button"
                  className="tool-modal__action tool-modal__close"
                  onClick={onClose}
                  aria-label={closeLabel}
                >
                  <X size={18} strokeWidth={2.25} aria-hidden />
                </button>
              </div>
            </header>
            ) : (
              <h2 id={titleId} className="tool-modal__title-sr">
                {title}
              </h2>
            )}

            <div className="tool-modal__body">
              {tab === "calc" && !contentReady ? (
                <div className="tool-modal__boot" aria-live="polite">
                  <span className="tool-modal__calc-spinner" aria-hidden />
                  <span>{loadingLabel}</span>
                </div>
              ) : null}

              {panes.map(({ id, content, scroll }) => (
                <div
                  key={id}
                  className={clsx(
                    "tool-modal__pane",
                    scroll && "tool-modal__pane--scroll",
                    tab === id && "tool-modal__pane--active",
                    id === "calc" && !contentReady && "tool-modal__pane--pending",
                  )}
                  aria-hidden={tab !== id}
                >
                  {content}
                </div>
              ))}
            </div>

            {copied ? (
              <div className="tool-modal__toast" role="status" aria-live="polite">
                {linkCopiedLabel}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
