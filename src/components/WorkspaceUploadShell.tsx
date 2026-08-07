"use client";

import { clsx } from "clsx";
import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ToolModalRating } from "@/components/tool-modal/ToolModalRating";
import { ToolWorkspaceOverview } from "@/components/layout/ToolWorkspaceOverview";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { usePendingDropzoneHandoff } from "@/hooks/usePendingFileInputHandoff";
import { usePathname } from "@/i18n/navigation";
import { getToolsDataEntry } from "@/data/tools-data";
import {
  getCategoryAccentColor,
  getCategoryAccentCssVar,
  getContrastingInk,
  isInventoryCategoryId,
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { parseToolHierarchyPath } from "@/lib/tool-hierarchy";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import { getToolDisplayLabel } from "@/lib/tool-labels";
import { getToolInteractionMode } from "@/lib/tool-interaction-mode";
import { registry } from "@/lib/registry";
import {
  scrollToWorkspaceUpload,
  setToolHasUploadShell,
  setWorkspacePhase,
  WORKSPACE_PHASE_CLEAN_CLASS,
  type WorkspacePhase,
} from "@/lib/workspace-flow";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

type WorkspaceUploadShellProps = {
  children: ReactNode;
  className?: string;
  /**
   * When provided, drives clean/active layout explicitly.
   * When omitted, phase is inferred from `requiresUpload` and/or a primary dropzone.
   */
  active?: boolean;
  /**
   * When false, this tool is an interactive generator — start in active tool chrome
   * (no upload gate). Prefer setting `requiresUpload: false` on the tool definition.
   */
  requiresUpload?: boolean;
  /** @deprecated Privacy badge is rendered by layout/ToolLayout on tool routes. */
  showPrivacyBadge?: boolean;
  /**
   * Render the DOC overview strip under the workspace (default true on tool pages).
   * Disable for homepage hero and other non-tool shells.
   */
  showOverview?: boolean;
  /**
   * Title banner + rating chrome above the dropzone.
   * Defaults to `showOverview` so the homepage hero stays clean.
   */
  showToolChrome?: boolean;
};

function resolvePhase(
  active: boolean | undefined,
  requiresUpload: boolean | undefined,
  hasDropzone: boolean,
): WorkspacePhase {
  if (typeof active === "boolean") return active ? "active" : "clean";
  if (requiresUpload === false) return "active";
  if (requiresUpload === true) return hasDropzone ? "clean" : "active";
  return hasDropzone ? "clean" : "active";
}

/**
 * SSR / first-paint phase — must match post-hydration for upload tools so
 * layout CSS (gutters, dropzone bounds, footer) does not flash then override.
 * Assume a primary dropzone will mount when upload is required.
 */
function resolveInitialPhase(
  active: boolean | undefined,
  requiresUpload: boolean | undefined,
): WorkspacePhase {
  if (typeof active === "boolean") return active ? "active" : "clean";
  if (requiresUpload === false) return "active";
  return "clean";
}

function hasPrimaryDropzone(root: HTMLElement) {
  return Boolean(root.querySelector(".im-dropzone:not(.im-dropzone--compact)"));
}

/**
 * Tool workspace upload shell — phase-aware immersive dropzone vs active controls.
 * Header, FAQ, and feedback are provided by layout/ToolLayout.
 */
export function WorkspaceUploadShell({
  children,
  className,
  active,
  requiresUpload,
  showOverview = true,
  showToolChrome,
}: WorkspaceUploadShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || "";
  const { headline, slug: shellSlug } = useToolPageShell();
  const tTools = useTranslations("Tools");
  const chromeEnabled = showToolChrome ?? showOverview;
  const isUploadToolRef = useRef(
    typeof active === "boolean" || requiresUpload !== false,
  );

  const { accentStyle, categoryId, resolvedSlug, isInteractiveChrome } = useMemo(() => {
    const fromQuery =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("category")
        : null;
    const hierarchy = parseToolHierarchyPath(pathname);
    const slug = hierarchy?.slug
      ? resolveCanonicalToolSlug(hierarchy.slug)
      : shellSlug
        ? resolveCanonicalToolSlug(shellSlug)
        : undefined;
    const resolvedCategoryId =
      (isInventoryCategoryId(fromQuery) ? fromQuery : undefined) ??
      resolveToolAccentCategoryId(
        slug,
        hierarchy?.categoryId ?? resolveToolCategoryId(slug),
      ) ??
      hierarchy?.categoryId ??
      resolveToolCategoryId(slug);
    const interactive =
      getToolInteractionMode(
        slug
          ? { slug, operation: slug, requiresUpload }
          : typeof requiresUpload === "boolean"
            ? { slug: "", operation: "", requiresUpload }
            : null,
      ) === "interactive";
    if (!resolvedCategoryId) {
      return {
        accentStyle: undefined as CSSProperties | undefined,
        categoryId: undefined as InventoryCategoryId | undefined,
        resolvedSlug: slug,
        isInteractiveChrome: interactive,
      };
    }
    return {
      categoryId: resolvedCategoryId as InventoryCategoryId,
      accentStyle: {
        "--category-accent": getCategoryAccentCssVar(resolvedCategoryId),
        "--category-accent-ink": getContrastingInk(
          getCategoryAccentColor(resolvedCategoryId),
        ),
      } as CSSProperties,
      resolvedSlug: slug,
      isInteractiveChrome: interactive,
    };
  }, [pathname, shellSlug, requiresUpload]);

  const initialPhase = resolveInitialPhase(active, requiresUpload);
  usePendingDropzoneHandoff(rootRef);

  useEffect(() => {
    const onFocusUpload = (event: MessageEvent) => {
      if (event.data?.type !== "joinmypdf:focus-workspace-upload") return;
      scrollToWorkspaceUpload();
    };
    window.addEventListener("message", onFocusUpload);
    return () => window.removeEventListener("message", onFocusUpload);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    let alive = true;

    const sync = () => {
      if (!alive) return;
      const dropzone = hasPrimaryDropzone(root);
      const phase = resolvePhase(active, requiresUpload, dropzone);

      if (typeof active === "boolean" || requiresUpload === false || dropzone) {
        isUploadToolRef.current = requiresUpload !== false || dropzone;
      }
      if (requiresUpload === false) {
        isUploadToolRef.current = true;
      }

      if (root.dataset.workspacePhase !== phase) {
        root.dataset.workspacePhase = phase;
      }
      setWorkspacePhase(phase, root);
      setToolHasUploadShell(isUploadToolRef.current);
    };

    sync();

    const cleanup = () => {
      alive = false;
      if (frame) window.cancelAnimationFrame(frame);
      window.requestAnimationFrame(() => {
        const stillClean = document.querySelector(
          '.tool-upload-float[data-workspace-phase="clean"]',
        );
        if (!stillClean) {
          document.documentElement.classList.remove(WORKSPACE_PHASE_CLEAN_CLASS);
          setToolHasUploadShell(false);
        }
      });
    };

    if (typeof active === "boolean" || requiresUpload === false) {
      return cleanup;
    }

    const observer = new MutationObserver(() => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        sync();
      });
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cleanup();
    };
  }, [active, requiresUpload]);

  const titleText = useMemo(() => {
    const fromShell = headline?.trim() || "";
    if (fromShell) return fromShell;
    if (!resolvedSlug) return "";
    const data = getToolsDataEntry(resolvedSlug);
    const registryTool = registry.tools.find((tool) => tool.slug === resolvedSlug);
    const english =
      registryTool?.title || data?.title || getToolDisplayLabel(resolvedSlug, resolvedSlug);
    return translateToolItem(tTools, resolvedSlug, english);
  }, [headline, resolvedSlug, tTools]);
  const ratingSlug = resolvedSlug || shellSlug || undefined;

  return (
    <div
      ref={rootRef}
      className={clsx(
        "tool-upload-float relative flex w-full min-h-0 flex-1 flex-col items-stretch",
        className,
      )}
      data-workspace-phase={initialPhase}
      data-requires-upload={isInteractiveChrome ? "0" : "1"}
      data-page-scroll={showOverview ? "1" : undefined}
      style={accentStyle}
    >
      {chromeEnabled ? (
        <div className="tool-upload-stage">
          <div className="tool-upload-stage__card">
            {titleText || ratingSlug ? (
              <div className="tool-title-banner">
                {titleText ? (
                  <p className="tool-title-banner__label">{titleText}</p>
                ) : (
                  <span className="tool-title-banner__label" aria-hidden />
                )}
                {ratingSlug ? (
                  <ToolModalRating
                    slug={ratingSlug}
                    categoryId={categoryId}
                    variant="banner"
                  />
                ) : null}
              </div>
            ) : null}

            <div className="tool-upload-stage__body">{children}</div>
          </div>
        </div>
      ) : (
        children
      )}

      {/* Overview / FAQ / related: sibling of the stage card (not inside it). */}
      {showOverview ? (
        <ToolWorkspaceOverview className="tool-workspace-overview--page" />
      ) : null}
    </div>
  );
}
