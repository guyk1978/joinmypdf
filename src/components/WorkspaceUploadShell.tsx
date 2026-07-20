"use client";

import { clsx } from "clsx";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { setWorkspacePhase, type WorkspacePhase } from "@/lib/workspace-flow";

type WorkspaceUploadShellProps = {
  children: ReactNode;
  className?: string;
  /**
   * When provided, drives clean/active layout explicitly.
   * When omitted, phase is inferred: dropzone present → clean, otherwise active.
   */
  active?: boolean;
  /** @deprecated Privacy badge is rendered by layout/ToolLayout on tool routes. */
  showPrivacyBadge?: boolean;
};

function resolvePhase(active: boolean | undefined, hasDropzone: boolean): WorkspacePhase {
  if (typeof active === "boolean") return active ? "active" : "clean";
  return hasDropzone ? "clean" : "active";
}

/**
 * Tool workspace upload shell — phase-aware immersive dropzone vs active controls.
 * Header, FAQ, and feedback are provided by layout/UtilityWorkspaceShell.
 */
export function WorkspaceUploadShell({
  children,
  className,
  active,
}: WorkspaceUploadShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      const hasDropzone = Boolean(root.querySelector(".im-dropzone"));
      const phase = resolvePhase(active, hasDropzone);
      root.dataset.workspacePhase = phase;

      // Propagate to layout roots when phase is explicit, or when there is no
      // #tool-workspace (media/image shells that swap dropzone ↔ panel).
      const hasToolWorkspace = Boolean(document.getElementById("tool-workspace"));
      if (typeof active === "boolean" || !hasToolWorkspace) {
        setWorkspacePhase(phase, root);
      }
    };

    sync();

    if (typeof active === "boolean") return;

    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [active]);

  return (
    <div
      ref={rootRef}
      className={clsx(
        "tool-upload-float relative flex w-full flex-col items-center",
        className,
      )}
      data-workspace-phase={typeof active === "boolean" ? (active ? "active" : "clean") : "clean"}
    >
      {children}
    </div>
  );
}
