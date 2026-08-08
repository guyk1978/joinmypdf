"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToolLocalProcessingBar } from "@/components/ToolLocalProcessingBar";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { toolPageDashboardStack } from "@/lib/tool-ui";
import "@/styles/tool-page-marketing.css";

export type ProductPageLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** dashboard = favorites/projects; document = about/terms/privacy prose; magazine = full-width blog index */
  variant?: "dashboard" | "document" | "magazine";
  showPrivacyBadge?: boolean;
  /** Optional eyebrow above the title (marketing pages). */
  eyebrow?: string;
};

/**
 * Shared product shell for tool-adjacent pages — marketing aesthetic matching tool hubs.
 */
export function ProductPageLayout({
  title,
  description,
  children,
  variant = "dashboard",
  showPrivacyBadge = false,
  eyebrow = "JoinMyPDF · Local-first",
}: ProductPageLayoutProps) {
  return (
    <div className={toolPageDashboardStack}>
      <div
        className={clsx(
          "tool-page-layout tool-page-layout--stacked product-page-layout",
          variant === "document" && "product-page-layout--document",
          (variant === "magazine" || variant === "dashboard") &&
            "product-page-layout--wide tool-page-layout--magazine",
          variant === "magazine" && "product-page-layout--magazine",
        )}
      >
        <ToolPageHeader title={title} description={description} eyebrow={eyebrow} />
        <div className="tool-page-layout__content flex min-h-0 w-full flex-1 flex-col">
          {children}
        </div>
        {showPrivacyBadge ? (
          <footer className="tool-page-layout__footer">
            <ToolLocalProcessingBar />
          </footer>
        ) : null}
      </div>
    </div>
  );
}
