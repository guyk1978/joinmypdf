"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";

type ToolLayoutProps = {
  children: ReactNode;
  className?: string;
  pageClassName?: string;
};

/** Utility tool workspaces — wraps ToolPageLayout with the operations anchor. */
export function ToolLayout({ children, className, pageClassName }: ToolLayoutProps) {
  return (
    <ToolPageLayout className={className} contentClassName={clsx("utility-tool-layout", pageClassName)}>
      <div id={WORKSPACE_OPERATIONS_ID}>{children}</div>
    </ToolPageLayout>
  );
}
