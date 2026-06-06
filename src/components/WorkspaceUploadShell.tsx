import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToolPrivacyStatement } from "@/components/ToolPrivacyStatement";
import { toolUploadStack } from "@/lib/tool-ui";

type WorkspaceUploadShellProps = {
  children: ReactNode;
  className?: string;
};

/** Aligns the unified privacy statement and upload dropzone as one cohesive block. */
export function WorkspaceUploadShell({ children, className }: WorkspaceUploadShellProps) {
  return (
    <div className={clsx(toolUploadStack, "tool-upload-stack", className)}>
      <ToolPrivacyStatement />
      {children}
    </div>
  );
}
