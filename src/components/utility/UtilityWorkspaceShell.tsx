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
   * Full-viewport utility/editor shell (30px margins, centered workspace).
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
  // Immersive utilities have no primary dropzone — treat as interactive generators.
  const resolvedRequiresUpload = requiresUpload ?? (immersive ? false : undefined);
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
