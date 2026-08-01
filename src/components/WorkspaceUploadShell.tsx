"use client";

import { clsx } from "clsx";
import { useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { ToolWorkspaceOverview } from "@/components/layout/ToolWorkspaceOverview";
import { usePendingDropzoneHandoff } from "@/hooks/usePendingFileInputHandoff";
import { usePathname } from "@/i18n/navigation";
import {
  getCategoryAccentColor,
  getCategoryAccentCssVar,
  getContrastingInk,
  isInventoryCategoryId,
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import { parseToolHierarchyPath } from "@/lib/tool-hierarchy";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import {
  setToolHasUploadShell,
  setWorkspacePhase,
  WORKSPACE_PHASE_CLEAN_CLASS,
  type WorkspacePhase,
} from "@/lib/workspace-flow";

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
}: WorkspaceUploadShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || "";
  const isUploadToolRef = useRef(
    typeof active === "boolean" || requiresUpload !== false,
  );

  /** Match modal title/rating: same accent drives the solid dropzone fill. */
  const accentStyle = useMemo(() => {
    const fromQuery =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("category")
        : null;
    const hierarchy = parseToolHierarchyPath(pathname);
    const slug = hierarchy?.slug
      ? resolveCanonicalToolSlug(hierarchy.slug)
      : undefined;
    const categoryId =
      (isInventoryCategoryId(fromQuery) ? fromQuery : undefined) ??
      resolveToolAccentCategoryId(
        slug,
        hierarchy?.categoryId ?? resolveToolCategoryId(slug),
      ) ??
      hierarchy?.categoryId ??
      resolveToolCategoryId(slug);
    if (!categoryId) return undefined;
    return {
      "--category-accent": getCategoryAccentCssVar(categoryId),
      "--category-accent-ink": getContrastingInk(getCategoryAccentColor(categoryId)),
    } as CSSProperties;
  }, [pathname]);

  const initialPhase = resolveInitialPhase(active, requiresUpload);
  usePendingDropzoneHandoff(rootRef);

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
      // Interactive generators still use the upload shell chrome bridge.
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
      // Defer until after unmount so we don't race Strict Mode remounts or
      // leave html.workspace-phase-clean stuck after leaving a tool page.
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

    // Explicit phase drivers — no MutationObserver needed.
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

  return (
    <div
      ref={rootRef}
      className={clsx(
        "tool-upload-float relative flex w-full min-h-0 flex-1 flex-col items-stretch",
        className,
      )}
      data-workspace-phase={initialPhase}
      data-requires-upload={requiresUpload === false ? "0" : "1"}
      style={accentStyle}
    >
      {children}
      {showOverview ? <ToolWorkspaceOverview /> : null}
    </div>
  );
}
