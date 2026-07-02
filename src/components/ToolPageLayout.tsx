"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { AdContainer } from "@/components/AdContainer";
import { ToolLocalProcessingBar } from "@/components/ToolLocalProcessingBar";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { WORKSPACE_UPLOAD_ID } from "@/lib/workspace-flow";

export type ToolPageLayoutProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showPrivacyBadge?: boolean;
  showHeader?: boolean;
};

/**
 * Standard Industrial Matte shell for every tool page:
 * prominent H1, one-line description, favorite control, tool body, privacy badge.
 */
export function ToolPageLayout({
  children,
  className,
  contentClassName,
  showPrivacyBadge = true,
  showHeader = true,
}: ToolPageLayoutProps) {
  const { headline, subline, tagline, slug, stacked } = useToolPageShell();
  const showPageHeader = showHeader && stacked && Boolean(headline);

  return (
    <div
      id={WORKSPACE_UPLOAD_ID}
      className={clsx(
        "tool-page-layout tool-upload-stack flex w-full flex-col",
        stacked && "tool-page-layout--stacked",
        className,
      )}
    >
      {showPageHeader ? (
        <ToolPageHeader title={headline} description={subline} tagline={tagline} slug={slug} />
      ) : null}

      <div className={clsx("tool-page-layout__content", contentClassName)}>{children}</div>

      {showPrivacyBadge ? (
        <footer className="tool-page-layout__footer">
          <ToolLocalProcessingBar />
        </footer>
      ) : null}

      {slug ? <AdContainer /> : null}
    </div>
  );
}
