"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToolLocalProcessingBar } from "@/components/ToolLocalProcessingBar";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { toolPageDashboardStack } from "@/lib/tool-ui";

export type ProductPageLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** dashboard = favorites/projects; document = about/terms/privacy prose */
  variant?: "dashboard" | "document";
  showPrivacyBadge?: boolean;
};

/**
 * Shared product shell for tool-adjacent pages — same width, header, and surface as tool pages.
 */
export function ProductPageLayout({
  title,
  description,
  children,
  variant = "dashboard",
  showPrivacyBadge = false,
}: ProductPageLayoutProps) {
  return (
    <div className={toolPageDashboardStack}>
      <div
        className={clsx(
          "tool-page-layout tool-page-layout--stacked product-page-layout",
          variant === "document" && "product-page-layout--document",
        )}
      >
        <ToolPageHeader title={title} description={description} />
        <div className="tool-page-layout__content">{children}</div>
        {showPrivacyBadge ? (
          <footer className="tool-page-layout__footer">
            <ToolLocalProcessingBar />
          </footer>
        ) : null}
      </div>
    </div>
  );
}
