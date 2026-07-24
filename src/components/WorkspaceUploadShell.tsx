"use client";

import { clsx } from "clsx";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import {
  setToolHasUploadShell,
  setWorkspacePhase,
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
}: WorkspaceUploadShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isUploadToolRef = useRef(
    typeof active === "boolean" || requiresUpload !== false,
  );

  const initialPhase = resolvePhase(active, requiresUpload, false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;

    const sync = () => {
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
      if (frame) window.cancelAnimationFrame(frame);
      setWorkspacePhase("active", root);
      setToolHasUploadShell(false);
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
    >
      {children}
    </div>
  );
}
