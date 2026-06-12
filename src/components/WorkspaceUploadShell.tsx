"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToolFavoriteButton } from "@/components/ToolFavoriteButton";
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
  const slug = pageShell.slug;
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
        <header
          className={clsx(
            "tool-upload-header relative w-full text-center",
            stacked ? "mb-6 px-4 pt-2" : "mb-8",
          )}
        >
          {slug ? (
            <ToolFavoriteButton slug={slug} className="absolute end-0 top-0" />
          ) : null}
          {headline ? (
            <h1
              className={clsx(
                "tool-glass-headline text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-5xl",
                slug && "px-10",
              )}
            >
              {headline}
            </h1>
          ) : null}
          {subline ? (
            <p className="tool-glass-subline mx-auto mt-3 max-w-xl text-base font-normal leading-relaxed text-neutral-500 dark:text-neutral-400 md:text-lg">
              {subline}
            </p>
          ) : null}
        </header>
      ) : null}

      <div className={clsx("tool-glass-container relative w-full", theme.shell)}>
        <div className="tool-glass-shell__body p-8 pb-16 md:p-10 md:pb-[4.5rem]">{children}</div>
        {showPrivacyBadge ? <ToolLocalProcessingBar /> : null}
      </div>
    </div>
  );
}
