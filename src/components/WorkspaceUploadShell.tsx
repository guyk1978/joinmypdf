"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToolLocalProcessingBar } from "@/components/ToolLocalProcessingBar";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { useToolGlassTheme } from "@/context/ToolGlassContext";
import { toolUploadStack } from "@/lib/tool-ui";

type WorkspaceUploadShellProps = {
  children: ReactNode;
  className?: string;
  /** Override page context headline (e.g. homepage hero). */
  headline?: string;
  /** Override page context description. */
  subline?: string;
  showPrivacyBadge?: boolean;
};

/**
 * Upper tool page block: title → flat upload panel → slim local-processing accent bar.
 */
export function WorkspaceUploadShell({
  children,
  className,
  headline: headlineProp,
  subline: sublineProp,
  showPrivacyBadge = true,
}: WorkspaceUploadShellProps) {
  const theme = useToolGlassTheme();
  const pageShell = useToolPageShell();
  const headline = headlineProp ?? pageShell.headline;
  const subline = sublineProp ?? pageShell.subline;
  const stacked = pageShell.stacked;
  const hasHeader = Boolean(headline || subline);

  return (
    <div
      className={clsx(
        stacked ? "w-full" : toolUploadStack,
        "tool-upload-stack tool-upload-upper-block flex w-full flex-col",
        className,
      )}
    >
      {hasHeader ? (
        <header className={clsx("tool-upload-header w-full text-center", stacked ? "mb-4 px-4 pt-4" : "mb-6")}>
          {headline ? (
            <h1 className="tool-glass-headline text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
              {headline}
            </h1>
          ) : null}
          {subline ? (
            <p className="tool-glass-subline mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-base">
              {subline}
            </p>
          ) : null}
        </header>
      ) : null}

      <div className={clsx("tool-glass-container w-full", theme.shell)}>
        <div className="tool-glass-shell__body p-6 md:p-8">{children}</div>
        {showPrivacyBadge ? <ToolLocalProcessingBar /> : null}
      </div>
    </div>
  );
}
