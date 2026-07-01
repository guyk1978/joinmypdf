"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToolPageLayout } from "@/components/ToolPageLayout";

type WorkspaceUploadShellProps = {
  children: ReactNode;
  className?: string;
  showPrivacyBadge?: boolean;
};

/** Upper tool page block — delegates to ToolPageLayout for header, privacy badge, and ad slot. */
export function WorkspaceUploadShell({
  children,
  className,
  showPrivacyBadge = true,
}: WorkspaceUploadShellProps) {
  return (
    <ToolPageLayout className={className} showPrivacyBadge={showPrivacyBadge}>
      <div className="tool-upload-float relative flex w-full flex-col items-center">{children}</div>
    </ToolPageLayout>
  );
}
