"use client";

import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pin, Save, ScanSearch, Share2, Star, X, ZoomIn } from "lucide-react";
import { clsx } from "clsx";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/hooks/useFavorites";
import { usePinnedTools } from "@/hooks/usePinnedTools";
import { usePageShare } from "@/hooks/usePageShare";
import { recordRecentTool } from "@/lib/recent-activity";
import {
  WORKSPACE_PROJECT_SNAPSHOT,
  WORKSPACE_PROJECT_STATE_MESSAGE,
  requestWorkspaceProjectSave,
  requestWorkspaceProjectSnapshot,
  type WorkspaceProjectSnapshotPayload,
} from "@/lib/workspace-project-messages";
import { saveProject } from "@/lib/project-storage";
import { useProjectToast } from "@/context/ProjectToastContext";
import { SaveProjectModal } from "@/components/SaveProjectModal";
import {
  getMagnifierPreference,
  getMagnifierSizeTier,
  MAGNIFIER_CAPABILITY_MESSAGE,
  MAGNIFIER_CAPABILITY_QUERY,
  MAGNIFIER_SIZE_TIERS,
  setMagnifierPreference,
  setMagnifierSizeTier,
  subscribeMagnifierPreference,
  subscribeMagnifierSizeTier,
  type MagnifierSizeTier,
} from "@/lib/magnifier-preference";
import { requestPreviewInspect } from "@/lib/preview-inspect";
import { ToolModalRating } from "@/components/tool-modal/ToolModalRating";
import { HomePageFooter } from "@/components/HomePageFooter";
import {
  getCategoryAccentCssVar,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import {
  WORKSPACE_PHASE_MESSAGE,
  type WorkspacePhase,
} from "@/lib/workspace-flow";
import { DOC_FULLSCREEN_MESSAGE } from "@/lib/doc-fullscreen";
import { getInitialWorkspacePhase } from "@/lib/tool-interaction-mode";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

export type ToolModalTab = "calc" | "doc" | "related" | "reviews";

export type ToolModalWrapperProps = {
  open: boolean;
  title: string;
  /** Short description included in Web Share payload. */
  description?: string;
  /** Tool id used for favorites toggle. */
  slug?: string;
  /**
   * When false, interactive generator — open with tool-specific active header.
   * Resolved from the tool definition / interaction-mode catalog when omitted.
   */
  requiresUpload?: boolean;
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
  /** REVIEWS tab — per-tool community reviews. */
  reviews?: ReactNode;
  defaultTab?: ToolModalTab;
  /** True once the CALC surface (e.g. iframe) has finished mounting. */
  contentReady?: boolean;
  labels?: {
    calc?: string;
    doc?: string;
    related?: string;
    reviews?: string;
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
    saveProject?: string;
  };
  className?: string;
};

/**
 * Global JoinMyPDF tool modal shell (Industrial Matte).
 * Site header stays visible; a delicate full-width tool sub-header sits under it.
 * Upload / workspace fills the remaining viewport below that bar.
 */
export function ToolModalWrapper({
  open,
  title,
  description,
  slug,
  requiresUpload,
  categoryId: categoryIdProp,
  onClose,
  onExitComplete,
  calc,
  docs,
  related,
  reviews,
  defaultTab = "calc",
  contentReady = true,
  labels,
  className,
}: ToolModalWrapperProps) {
  const titleId = useId();
  const initialPhase = getInitialWorkspacePhase(
    slug
      ? { slug, operation: slug, requiresUpload }
      : requiresUpload === false
        ? { slug: "", operation: "", requiresUpload: false }
        : null,
  );
  const [tab, setTab] = useState<ToolModalTab>(defaultTab);
  const [workspacePhase, setWorkspacePhase] = useState<WorkspacePhase>(initialPhase);
  /** True once the workspace is in active tool chrome (file uploaded or interactive generator). */
  const hasFileUploaded = workspacePhase === "active";
  /** True only while the active workspace has a mounted Magnifier preview. */
  const [magnifierAvailable, setMagnifierAvailable] = useState(false);
  /** Loupe follows the pointer — hide Search/size chips when hover is unavailable. */
  const [finePointerHover, setFinePointerHover] = useState(true);
  /** Embedded tool is in CSS/native document fullscreen — Escape must not close modal. */
  const [docFullscreenActive, setDocFullscreenActive] = useState(false);
  const [loupeEnabled, setLoupeEnabled] = useState(true);
  const [loupeSize, setLoupeSize] = useState<MagnifierSizeTier>("medium");
  const [mounted, setMounted] = useState(false);
  const [canSaveProject, setCanSaveProject] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveSnapshot, setSaveSnapshot] = useState<WorkspaceProjectSnapshotPayload | null>(
    null,
  );
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isPinned, pinTool, unpinTool } = usePinnedTools();
  const { showToast } = useProjectToast();
  const tProjects = useTranslations("Projects");
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
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointerHover(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
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
    setWorkspacePhase(
      getInitialWorkspacePhase(
        slug
          ? { slug, operation: slug, requiresUpload }
          : requiresUpload === false
            ? { slug: "", operation: "", requiresUpload: false }
            : null,
      ),
    );
    setMagnifierAvailable(false);
    setDocFullscreenActive(false);
    setCanSaveProject(false);
    setSaveModalOpen(false);
    setSaveSnapshot(null);
    setSaveBusy(false);
  }, [open, defaultTab, title, slug, requiresUpload]);

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
      if (event.key !== "Escape") return;
      // Document fullscreen (esp. CSS fallback) owns Escape — closing the modal
      // here would discard the workspace session.
      if (docFullscreenActive || event.defaultPrevented) return;
      if (saveModalOpen) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, docFullscreenActive, saveModalOpen]);

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
      if (type === MAGNIFIER_CAPABILITY_MESSAGE) {
        setMagnifierAvailable(Boolean((data as { available?: boolean }).available));
        return;
      }
      if (type === DOC_FULLSCREEN_MESSAGE) {
        setDocFullscreenActive(Boolean((data as { active?: boolean }).active));
        return;
      }
      if (type === WORKSPACE_PROJECT_STATE_MESSAGE) {
        setCanSaveProject(Boolean((data as { canSave?: boolean }).canSave));
        return;
      }
      if (type === WORKSPACE_PROJECT_SNAPSHOT) {
        const snapshot = data as WorkspaceProjectSnapshotPayload;
        if (!snapshot.canSave || !Array.isArray(snapshot.files) || snapshot.files.length === 0) {
          return;
        }
        setSaveSnapshot(snapshot);
        setCanSaveProject(true);
        setSaveModalOpen(true);
      }
    };

    const onCustomPhase = (event: Event) => {
      const phase = (event as CustomEvent<{ phase?: WorkspacePhase }>).detail?.phase;
      if (phase === "clean" || phase === "active") applyPhase(phase);
    };

    const onCustomMagnifierCapability = (event: Event) => {
      setMagnifierAvailable(
        Boolean((event as CustomEvent<{ available?: boolean }>).detail?.available),
      );
    };

    const onCustomDocFullscreen = (event: Event) => {
      setDocFullscreenActive(
        Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active),
      );
    };

    const onCustomProjectState = (event: Event) => {
      setCanSaveProject(
        Boolean((event as CustomEvent<{ canSave?: boolean }>).detail?.canSave),
      );
    };

    const onCustomSnapshot = (event: Event) => {
      const snapshot = (event as CustomEvent<WorkspaceProjectSnapshotPayload>).detail;
      if (!snapshot?.canSave || !Array.isArray(snapshot.files) || snapshot.files.length === 0) {
        return;
      }
      setSaveSnapshot(snapshot);
      setCanSaveProject(true);
      setSaveModalOpen(true);
    };

    window.addEventListener("message", onMessage);
    window.addEventListener(WORKSPACE_PHASE_MESSAGE, onCustomPhase);
    window.addEventListener(MAGNIFIER_CAPABILITY_MESSAGE, onCustomMagnifierCapability);
    window.addEventListener(DOC_FULLSCREEN_MESSAGE, onCustomDocFullscreen);
    window.addEventListener(WORKSPACE_PROJECT_STATE_MESSAGE, onCustomProjectState);
    window.addEventListener(WORKSPACE_PROJECT_SNAPSHOT, onCustomSnapshot);

    // A cached iframe can mount its Magnifier before this listener. Query all
    // tool frames once so the shared header recovers the current capability.
    for (let index = 0; index < window.frames.length; index += 1) {
      try {
        window.frames[index]?.postMessage({ type: MAGNIFIER_CAPABILITY_QUERY }, "*");
      } catch {
        // Ignore unavailable/cross-origin frames.
      }
    }

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener(WORKSPACE_PHASE_MESSAGE, onCustomPhase);
      window.removeEventListener(MAGNIFIER_CAPABILITY_MESSAGE, onCustomMagnifierCapability);
      window.removeEventListener(DOC_FULLSCREEN_MESSAGE, onCustomDocFullscreen);
      window.removeEventListener(WORKSPACE_PROJECT_STATE_MESSAGE, onCustomProjectState);
      window.removeEventListener(WORKSPACE_PROJECT_SNAPSHOT, onCustomSnapshot);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      document.documentElement.removeAttribute("data-tool-modal-open");
      document.documentElement.removeAttribute("data-tool-modal-workspace");
      document.documentElement.removeAttribute("data-tool-modal-fullscreen");
      document.documentElement.removeAttribute("data-tool-intro");
      return;
    }

    document.documentElement.setAttribute("data-tool-modal-open", "1");
    document.documentElement.setAttribute("data-tool-modal-workspace", workspacePhase);
    document.documentElement.removeAttribute("data-tool-intro");
    // Fullscreen = fill the viewport below the sticky site header (never cover it).
    document.documentElement.setAttribute("data-tool-modal-fullscreen", "1");

    return () => {
      document.documentElement.removeAttribute("data-tool-modal-open");
      document.documentElement.removeAttribute("data-tool-modal-workspace");
      document.documentElement.removeAttribute("data-tool-modal-fullscreen");
      document.documentElement.removeAttribute("data-tool-intro");
    };
  }, [open, workspacePhase]);

  if (!mounted) return null;

  const handleSaveProjectClick = () => {
    // Prefer parent-owned modal via snapshot from the tool iframe.
    requestWorkspaceProjectSnapshot();
    // Fallback: open the in-frame Save Project UI if the snapshot never arrives
    // (e.g. File transfer blocked, or bridge only handles SAVE_REQUEST).
    window.setTimeout(() => {
      setSaveModalOpen((open) => {
        if (!open) requestWorkspaceProjectSave();
        return open;
      });
    }, 120);
  };

  const handleHeaderProjectSave = async (name: string) => {
    if (!saveSnapshot || saveSnapshot.files.length === 0) return;
    setSaveBusy(true);
    try {
      await saveProject({
        name,
        toolSlug: saveSnapshot.toolSlug || slug || "tool",
        operation: saveSnapshot.operation || slug || "tool",
        files: saveSnapshot.files,
        settings: saveSnapshot.settings,
      });
      setSaveModalOpen(false);
      setSaveSnapshot(null);
      showToast(tProjects("savedToast"));
    } catch {
      showToast(tProjects("saveFailed"));
    } finally {
      setSaveBusy(false);
    }
  };

  const calcLabel = labels?.calc ?? "CALC";
  const docLabel = labels?.doc ?? "DOC";
  const relatedLabel = labels?.related ?? "RELATED";
  const reviewsLabel = labels?.reviews ?? "REVIEWS";
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
  const saveProjectLabel = labels?.saveProject ?? tProjects("saveProject");

  const tabLabels: Record<ToolModalTab, string> = {
    calc: calcLabel,
    doc: docLabel,
    related: relatedLabel,
    reviews: reviewsLabel,
  };

  const panes: { id: ToolModalTab; content: ReactNode; scroll?: boolean }[] = [
    { id: "calc", content: calc },
    ...(docs != null ? [{ id: "doc" as const, content: docs, scroll: true }] : []),
    ...(related != null
      ? [{ id: "related" as const, content: related, scroll: true }]
      : []),
    ...(reviews != null
      ? [{ id: "reviews" as const, content: reviews, scroll: true }]
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
            <div className="tool-modal__rail">
            <div className="tool-modal__workspace">
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
                  {panes.map(({ id }) => (
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
                      {tabLabels[id]}
                    </button>
                  ))}
                </nav>

                <button
                  type="button"
                  className={clsx(
                    "tool-modal__save-project",
                    !canSaveProject && "tool-modal__save-project--disabled",
                  )}
                  onClick={handleSaveProjectClick}
                  disabled={!canSaveProject}
                  aria-label={saveProjectLabel}
                  title={saveProjectLabel}
                >
                  <Save size={16} strokeWidth={2.25} aria-hidden />
                  <span className="tool-modal__save-project-label">{saveProjectLabel}</span>
                </button>

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
                      if (pinned) {
                        unpinTool(slug);
                        return;
                      }
                      pinTool(slug);
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

                {hasFileUploaded && magnifierAvailable ? (
                  <div
                    className={clsx(
                      "tool-modal__loupe-cluster",
                      !loupeEnabled && finePointerHover && "tool-modal__loupe-cluster--off",
                    )}
                  >
                  {finePointerHover ? (
                    <>
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
                    <ScanSearch size={18} strokeWidth={2} aria-hidden />
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
                    </>
                  ) : null}

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
                ) : null}

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
            </div>

            <div className="tool-modal__site-footer">
              <HomePageFooter />
            </div>
            </div>

            {copied ? (
              <div className="tool-modal__toast" role="status" aria-live="polite">
                {linkCopiedLabel}
              </div>
            ) : null}

            <SaveProjectModal
              open={saveModalOpen}
              busy={saveBusy}
              defaultName=""
              onClose={() => {
                if (!saveBusy) setSaveModalOpen(false);
              }}
              onSave={handleHeaderProjectSave}
            />
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
