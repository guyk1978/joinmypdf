"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToolPrivacyBadge } from "@/components/ToolPrivacyBadge";
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
 * Reference layout: centered header (title + description) → glass card (p-10) → privacy badge.
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
  const hasHeader = Boolean(headline || subline);

  return (
    <div
      className={clsx(
        toolUploadStack,
        "tool-upload-stack tool-glass-shell flex w-full flex-col items-center",
        className,
      )}
    >
      {hasHeader ? (
        <header className="tool-glass-header mb-6 w-full text-center">
          {headline ? (
            <h1 className="tool-glass-headline text-3xl font-bold tracking-tight text-ink dark:text-white md:text-4xl">
              {headline}
            </h1>
          ) : null}
          {subline ? (
            <p className="tool-glass-subline mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 md:text-base">
              {subline}
            </p>
          ) : null}
        </header>
      ) : null}

      <div className={clsx("tool-glass-container w-full p-10", theme.shell)}>
        <div className="tool-glass-shell__body">{children}</div>
      </div>

      {showPrivacyBadge ? (
        <div className="tool-glass-privacy-wrap mt-6 flex justify-center">
          <ToolPrivacyBadge />
        </div>
      ) : null}
    </div>
  );
}
