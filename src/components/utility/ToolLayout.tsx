"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";

type ToolLayoutProps = {
  children: ReactNode;
  className?: string;
  pageClassName?: string;
};

/** Shared Industrial Matte shell for utility tools (favicon, text & JSON). */
export function ToolLayout({ children, className, pageClassName }: ToolLayoutProps) {
  return (
    <WorkspaceUploadShell showPrivacyBadge className={className}>
      <div id={WORKSPACE_OPERATIONS_ID} className={clsx("utility-tool-layout", pageClassName)}>
        {children}
      </div>
    </WorkspaceUploadShell>
  );
}
