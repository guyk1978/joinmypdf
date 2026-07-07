"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";

type UtilityWorkspaceShellProps = {
  children: ReactNode;
  className?: string;
  pageClassName?: string;
};

/** Utility tool body — operations anchor only; header/FAQ/feedback live in layout/ToolLayout. */
export function UtilityWorkspaceShell({ children, className, pageClassName }: UtilityWorkspaceShellProps) {
  return (
    <div className={clsx("utility-tool-layout", className, pageClassName)} id={WORKSPACE_OPERATIONS_ID}>
      {children}
    </div>
  );
}
