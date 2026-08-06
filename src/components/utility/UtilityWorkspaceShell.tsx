"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";

type UtilityWorkspaceShellProps = {
  children: ReactNode;
  className?: string;
  pageClassName?: string;
  /**
   * Drives clean/active layout explicitly.
   * When omitted, phase follows `requiresUpload` (immersive utilities default to interactive/active).
   */
  active?: boolean;
  /**
   * When false, interactive generator — active tool header from mount.
   * Immersive shells default to `false` (no upload gate).
   */
  requiresUpload?: boolean;
  /**
   * Non-upload utility/editor shell on the global 90% content rail.
   * Document/window scrolls — no fixed inset panel or nested stage scrollbar.
   * Implies an interactive generator unless `requiresUpload` is set explicitly.
   */
  immersive?: boolean;
};

/** Utility tool body — optional immersive shell + operations anchor. */
export function UtilityWorkspaceShell({
  children,
  className,
  pageClassName,
  active,
  requiresUpload,
  immersive = false,
}: UtilityWorkspaceShellProps) {
  // Interactive utilities (text/converters/calculators) never use an upload gate.
  // Upload-gated utilities (e.g. image extractors) still pass requiresUpload / omit immersive.
  const resolvedRequiresUpload =
    typeof requiresUpload === "boolean" ? requiresUpload : immersive ? false : undefined;
  const resolvedActive =
    typeof active === "boolean"
      ? active
      : resolvedRequiresUpload === false
        ? true
        : undefined;

  return (
    <WorkspaceUploadShell
      active={resolvedActive}
      requiresUpload={resolvedRequiresUpload}
      className={clsx(className, pageClassName, immersive && "tool-upload-float--immersive")}
    >
      <div
        className={clsx("utility-tool-layout", immersive && "im-utility-stage")}
        id={WORKSPACE_OPERATIONS_ID}
      >
        {children}
      </div>
    </WorkspaceUploadShell>
  );
}
