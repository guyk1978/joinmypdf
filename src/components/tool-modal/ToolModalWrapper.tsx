"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/hooks/useFavorites";
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
  subscribeMagnifierPreference,
  subscribeMagnifierSizeTier,
  type MagnifierSizeTier,
} from "@/lib/magnifier-preference";
import { useOptionalToolModal } from "@/components/tool-modal/tool-modal-context";
import type {
  ToolModalSessionValue,
  ToolModalTab,
} from "@/components/tool-modal/tool-modal-session-context";
import { HomePageFooter } from "@/components/HomePageFooter";
import {
  getCategoryAccentColor,
  getCategoryAccentCssVar,
  getContrastingInk,
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import {
  WORKSPACE_PHASE_MESSAGE,
  WORKSPACE_SET_TAB_EVENT,
  WORKSPACE_SET_TAB_MESSAGE,
  type WorkspacePhase,
} from "@/lib/workspace-flow";
import { subscribeToolModalTab } from "@/lib/tool-modal-tab-bus";
import { DOC_FULLSCREEN_MESSAGE } from "@/lib/doc-fullscreen";
import { getInitialWorkspacePhase } from "@/lib/tool-interaction-mode";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

export type { ToolModalTab } from "@/components/tool-modal/tool-modal-session-context";

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
  /** Controlled tab from ToolModalProvider (OPERATION menu). */
  tab?: ToolModalTab;
  onTabChange?: (tab: ToolModalTab) => void;
  /** True once the CALC surface (e.g. iframe) has finished mounting. */
  contentReady?: boolean;
  labels?: {
    calc?: string;
    doc?: string;
    related?: string;
    reviews?: string;
    close?: string;
    share?: string;
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
 * Site header stays visible; TOOLS dropdown hosts tabs + session actions.
 * Title banner + ratings live in the upload shell above/below the dropzone.
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
  tab: tabProp,
  onTabChange,
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
  const [tabState, setTabState] = useState<ToolModalTab>(defaultTab);
  const tab = tabProp ?? tabState;
  const isTabControlled = tabProp != null;
  const setTab = useCallback(
    (next: ToolModalTab) => {
      if (!isTabControlled) setTabState(next);
      onTabChange?.(next);
    },
    [isTabControlled, onTabChange],
  );
  const wasOpenRef = useRef(false);
  const prevSlugForTabRef = useRef<string | undefined>(undefined);
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
  const toolModal = useOptionalToolModal();
  const { showToast } = useProjectToast();
  const tProjects = useTranslations("Projects");
  const favorited = slug ? isFavorite(slug) : false;
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
  const accentCategoryId =
    resolveToolAccentCategoryId(slug, categoryId) ?? categoryId;
  const accentStyle = accentCategoryId
    ? ({
        "--category-accent": getCategoryAccentCssVar(accentCategoryId),
        "--category-accent-ink": getContrastingInk(
          getCategoryAccentColor(accentCategoryId),
        ),
      } as CSSProperties)
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
    // Only reset chrome when the modal newly opens or the tool slug changes —
    // never when parent re-renders with the same slug (that wiped DOC/RELATED).
    const slugChanged = prevSlugForTabRef.current !== slug;
    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;
    prevSlugForTabRef.current = slug;
    if (justOpened || slugChanged) {
      // Provider owns tab when controlled — avoid feedback setState loops.
      if (!isTabControlled) {
        setTab(defaultTab);
      }
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
    }
  }, [open, defaultTab, slug, requiresUpload, isTabControlled, setTab]);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
    }
  }, [open]);

  const setTabRef = useRef(setTab);

  useLayoutEffect(() => {
    setTabRef.current = setTab;
  });

  useLayoutEffect(() => {
    if (!open) return;
    const onTab = (next: ToolModalTab) => {
      setTabRef.current(next);
    };
    const unsubscribe = subscribeToolModalTab(onTab);
    return () => {
      unsubscribe();
    };
  }, [open]);

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
      if (type === WORKSPACE_SET_TAB_MESSAGE) {
        const tab = (data as { tab?: string }).tab;
        if (tab === "calc" || tab === "doc" || tab === "related" || tab === "reviews") {
          setTab(tab);
        }
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
        setCanSaveProject((prev) => {
          const next = Boolean((data as { canSave?: boolean }).canSave);
          return prev === next ? prev : next;
        });
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

    const onCustomSetTab = (event: Event) => {
      const next = (event as CustomEvent<{ tab?: string }>).detail?.tab;
      if (next === "calc" || next === "doc" || next === "related" || next === "reviews") {
        setTab(next);
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
      setCanSaveProject((prev) => {
        const next = Boolean(
          (event as CustomEvent<{ canSave?: boolean }>).detail?.canSave,
        );
        return prev === next ? prev : next;
      });
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
    window.addEventListener(WORKSPACE_SET_TAB_EVENT, onCustomSetTab);
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
      window.removeEventListener(WORKSPACE_SET_TAB_EVENT, onCustomSetTab);
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

  // Active-phase CSS + iframe fill height depend on a fresh rail measure.
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
    const t1 = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
    const t2 = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
    return () => {
      window.cancelAnimationFrame(id);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [open, workspacePhase]);

  const calcLabel = labels?.calc ?? "CALC";
  const docLabel = labels?.doc ?? "DOC";
  const relatedLabel = labels?.related ?? "RELATED";
  const reviewsLabel = labels?.reviews ?? "REVIEWS";
  const closeLabel = labels?.close ?? "Close";
  const loadingLabel = labels?.loading ?? "Loading tool…";
  const favoriteLabel = favorited
    ? (labels?.removeFavorite ?? "Remove from favorites")
    : (labels?.addFavorite ?? "Add to favorites");
  const saveProjectLabel = labels?.saveProject ?? tProjects("saveProject");
  const shareMenuLabel = labels?.share ?? "Share";

  const tabLabels = useMemo<Record<ToolModalTab, string>>(
    () => ({
      calc: calcLabel,
      doc: docLabel,
      related: relatedLabel,
      reviews: reviewsLabel,
    }),
    [calcLabel, docLabel, relatedLabel, reviewsLabel],
  );

  const hasDocs = docs != null;
  const hasRelated = related != null;
  const hasReviews = reviews != null;

  const availableTabs = useMemo<ToolModalTab[]>(() => {
    const tabs: ToolModalTab[] = ["calc"];
    if (hasDocs) tabs.push("doc");
    if (hasRelated) tabs.push("related");
    if (hasReviews) tabs.push("reviews");
    return tabs;
  }, [hasDocs, hasRelated, hasReviews]);

  const handleSaveProjectClick = useCallback(() => {
    requestWorkspaceProjectSnapshot();
    window.setTimeout(() => {
      setSaveModalOpen((isOpen) => {
        if (!isOpen) requestWorkspaceProjectSave();
        return isOpen;
      });
    }, 120);
  }, []);

  const handleShareClick = useCallback(() => {
    void handleShare();
  }, [handleShare]);

  const handleFavoriteClick = useCallback(() => {
    if (slug) toggleFavorite(slug);
  }, [slug, toggleFavorite]);

  const sessionValue = useMemo<ToolModalSessionValue>(
    () => ({
      open,
      slug,
      tab,
      setTab,
      availableTabs,
      tabLabels,
      canSaveProject,
      saveProject: handleSaveProjectClick,
      saveProjectLabel,
      share: handleShareClick,
      shareBusy,
      shareLabel: shareMenuLabel,
      favorited,
      toggleFavorite: handleFavoriteClick,
      favoriteLabel,
      close: onClose,
      closeLabel,
    }),
    [
      open,
      slug,
      tab,
      setTab,
      availableTabs,
      tabLabels,
      canSaveProject,
      handleSaveProjectClick,
      saveProjectLabel,
      handleShareClick,
      shareBusy,
      shareMenuLabel,
      favorited,
      handleFavoriteClick,
      favoriteLabel,
      onClose,
      closeLabel,
    ],
  );

  const sessionValueRef = useRef(sessionValue);

  useLayoutEffect(() => {
    sessionValueRef.current = sessionValue;
  });

  useLayoutEffect(() => {
    const register = toolModal?.registerSession;
    if (!register) return;
    if (!open) {
      register(null);
      return;
    }
    register(sessionValueRef.current);
  }, [
    open,
    slug,
    tab,
    canSaveProject,
    favorited,
    shareBusy,
    saveProjectLabel,
    shareMenuLabel,
    favoriteLabel,
    closeLabel,
    availableTabs,
    toolModal?.registerSession,
  ]);

  useEffect(() => {
    const register = toolModal?.registerSession;
    return () => register?.(null);
  }, [toolModal?.registerSession]);

  if (!mounted) return null;

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
            data-category={accentCategoryId || undefined}
            style={accentStyle}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* flex-1 content rail — grows so the site footer pins to the panel bottom */}
            <div className="tool-modal__rail">
              <div className="tool-modal__workspace">
                <div className="tool-modal__main">
                  <h2 id={titleId} className="sr-only">
                    {title}
                  </h2>

                  <div className="tool-modal__body" data-active-tab={tab}>
                    {/* Boot only for CALC — never cover DOC / RELATED / REVIEWS. */}
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
                          id === "calc" && "tool-modal__pane--calc",
                          scroll && "tool-modal__pane--scroll",
                          tab === id && "tool-modal__pane--active",
                          id === "calc" &&
                            !contentReady &&
                            tab === "calc" &&
                            "tool-modal__pane--pending",
                        )}
                        aria-hidden={tab !== id}
                        {...(tab !== id ? ({ inert: true } as { inert: boolean }) : {})}
                      >
                        {content}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct panel child — must stay outside the rail for sticky-footer flex */}
            <div className="tool-modal__site-footer" data-footer-host="panel">
              {/* In-flow under the rail — panel flex pins it; do not fixed-dock over the tool */}
              <HomePageFooter dock={false} />
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
