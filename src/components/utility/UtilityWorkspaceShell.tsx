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
   * Drives immersive clean/active layout.
   * When omitted, phase is inferred from a primary (non-compact) dropzone.
   */
  active?: boolean;
};

/** Utility tool body — immersive upload shell + operations anchor. */
export function UtilityWorkspaceShell({
  children,
  className,
  pageClassName,
  active,
}: UtilityWorkspaceShellProps) {
  return (
    <WorkspaceUploadShell active={active} className={clsx(className, pageClassName)}>
      <div className="utility-tool-layout" id={WORKSPACE_OPERATIONS_ID}>
        {children}
      </div>
    </WorkspaceUploadShell>
  );
}
