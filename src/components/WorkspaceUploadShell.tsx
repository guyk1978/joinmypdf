"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";

type WorkspaceUploadShellProps = {
  children: ReactNode;
  className?: string;
  /** @deprecated Privacy badge is rendered by layout/ToolLayout on tool routes. */
  showPrivacyBadge?: boolean;
};

/** Tool workspace body — header, FAQ, and feedback are provided by layout/UtilityWorkspaceShell. */
export function WorkspaceUploadShell({ children, className }: WorkspaceUploadShellProps) {
  return (
    <div className={clsx("tool-upload-float relative flex w-full flex-col items-center", className)}>
      {children}
    </div>
  );
}
