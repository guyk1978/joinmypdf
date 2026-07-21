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
   * When omitted, phase is inferred: primary dropzone present → clean, otherwise active.
   */
  active?: boolean;
  /** @deprecated Privacy badge is rendered by layout/ToolLayout on tool routes. */
  showPrivacyBadge?: boolean;
};

function resolvePhase(active: boolean | undefined, hasDropzone: boolean): WorkspacePhase {
  if (typeof active === "boolean") return active ? "active" : "clean";
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
}: WorkspaceUploadShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isUploadToolRef = useRef(typeof active === "boolean");

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;

    const sync = () => {
      const dropzone = hasPrimaryDropzone(root);
      const phase = resolvePhase(active, dropzone);

      if (typeof active === "boolean" || dropzone) {
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

    if (typeof active === "boolean") {
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
  }, [active]);

  return (
    <div
      ref={rootRef}
      className={clsx(
        "tool-upload-float relative flex w-full min-h-0 flex-1 flex-col items-stretch",
        className,
      )}
      data-workspace-phase={typeof active === "boolean" ? (active ? "active" : "clean") : "clean"}
    >
      {children}
    </div>
  );
}

