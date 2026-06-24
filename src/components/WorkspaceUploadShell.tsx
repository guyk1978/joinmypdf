"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { AdContainer } from "@/components/AdContainer";
import { ToolLocalProcessingBar } from "@/components/ToolLocalProcessingBar";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { toolUploadStack } from "@/lib/tool-ui";

type WorkspaceUploadShellProps = {
  children: ReactNode;
  className?: string;
  showPrivacyBadge?: boolean;
};

/** Upper tool page block — floating upload zone (no glass container), privacy badge, ad slot. */
export function WorkspaceUploadShell({
  children,
  className,
  showPrivacyBadge = true,
}: WorkspaceUploadShellProps) {
  const pageShell = useToolPageShell();
  const stacked = pageShell.stacked;
  const slug = pageShell.slug;

  return (
    <div
      className={clsx(
        stacked ? "w-full" : toolUploadStack,
        "tool-upload-stack tool-upload-upper-block flex w-full flex-col",
        className,
      )}
    >
      <div className="tool-upload-float relative flex w-full flex-col items-center">
        {children}

        {showPrivacyBadge ? (
          <div className="mt-10 flex w-full max-w-2xl justify-center md:mt-12">
            <ToolLocalProcessingBar />
          </div>
        ) : null}
      </div>

      {slug ? <AdContainer /> : null}
    </div>
  );
}
