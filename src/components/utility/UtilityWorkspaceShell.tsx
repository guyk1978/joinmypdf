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
   * When omitted (and immersive is false), phase is inferred from a primary dropzone.
   */
  active?: boolean;
  /**
   * Full-viewport utility/editor shell (30px margins, centered workspace).
   * Forces clean phase and hides redundant page body headers.
   */
  immersive?: boolean;
};

/** Utility tool body — optional immersive shell + operations anchor. */
export function UtilityWorkspaceShell({
  children,
  className,
  pageClassName,
  active,
  immersive = false,
}: UtilityWorkspaceShellProps) {
  const resolvedActive = immersive ? false : active;

  return (
    <WorkspaceUploadShell
      active={resolvedActive}
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
