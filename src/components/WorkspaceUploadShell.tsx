"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToolPrivacyBadge } from "@/components/ToolPrivacyBadge";
import { useToolGlassTheme } from "@/context/ToolGlassContext";
import { toolUploadStack } from "@/lib/tool-ui";

type WorkspaceUploadShellProps = {
  children: ReactNode;
  className?: string;
  /** Hide privacy badge for non-file tools (e.g. generators). */
  showPrivacyBadge?: boolean;
};

/** Glass container: dropzone focal point + discreet privacy badge footer. */
export function WorkspaceUploadShell({
  children,
  className,
  showPrivacyBadge = true,
}: WorkspaceUploadShellProps) {
  const theme = useToolGlassTheme();

  return (
    <div className={clsx(toolUploadStack, "tool-upload-stack tool-glass-shell", className)}>
      <div className={clsx("overflow-hidden p-1.5 sm:p-2", theme.shell)}>
        <div className="tool-glass-shell__body">{children}</div>
        {showPrivacyBadge ? (
          <div className="mt-2 flex justify-start px-1 pb-0.5 pt-1 sm:px-1.5">
            <ToolPrivacyBadge />
          </div>
        ) : null}
      </div>
    </div>
  );
}
