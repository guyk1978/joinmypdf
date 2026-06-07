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
 * Strict layout matching reference mockup:
 * Title → Description → Main glass container (drop-zone) → Privacy badge (outside, centered).
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

  return (
    <div className={clsx(toolUploadStack, "tool-upload-stack tool-glass-shell", className)}>
      {headline ? (
        <h1 className="tool-glass-headline text-center text-3xl font-bold tracking-tight text-ink dark:text-white md:text-4xl">
          {headline}
        </h1>
      ) : null}

      {subline ? (
        <p className="tool-glass-subline mt-3 text-center text-sm leading-relaxed text-ink-muted dark:text-neutral-400 md:text-base">
          {subline}
        </p>
      ) : null}

      <div
        className={clsx(
          "tool-glass-container mt-8 w-full px-8 py-10 sm:px-10 sm:py-12 md:px-12 md:py-14",
          theme.shell,
          headline || subline ? "" : "mt-0",
        )}
      >
        <div className="tool-glass-shell__body">{children}</div>
      </div>

      {showPrivacyBadge ? (
        <div className="tool-glass-privacy-wrap mt-4 flex justify-center">
          <ToolPrivacyBadge />
        </div>
      ) : null}
    </div>
  );
}
