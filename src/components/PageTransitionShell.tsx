"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { HomePageFooter } from "@/components/HomePageFooter";
import { PageContentTransition } from "@/components/PageContentTransition";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolEmbedModeMarker } from "@/components/tool-modal/ToolEmbedModeMarker";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import {
  PageChromeActiveProvider,
  usePageChromeActive,
} from "@/context/PageChromeContext";
import { PageTransitionProvider, usePageTransition } from "@/context/PageTransitionContext";

type PageTransitionShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

function PageTransitionCanvas({ children, mainClassName }: PageTransitionShellProps) {
  const { handleLinkClickCapture } = usePageTransition();
  const embed = useToolEmbedMode();

  return (
    <div
      className={clsx(
        "app-page-canvas flex min-h-0 w-full flex-1 flex-col",
        embed && "app-page-canvas--tool-embed",
      )}
      onClickCapture={handleLinkClickCapture}
    >
      <ToolEmbedModeMarker />
      {embed ? null : <SiteHeader />}
      <main
        className={clsx(
          "home-tool-grid-page flex min-h-0 w-full flex-1 flex-col",
          embed ? "h-full max-w-none" : null,
          mainClassName,
        )}
        data-tool-workspace={
          typeof mainClassName === "string" && mainClassName.includes("tool-page-main")
            ? "1"
            : undefined
        }
      >
        <PageContentTransition className="page-content-transition--main flex min-h-0 w-full flex-1 flex-col">
          {children}
        </PageContentTransition>
      </main>
      {embed ? null : <HomePageFooter />}
    </div>
  );
}

/** Client shell: sequential exit → navigate → enter on main content only. */
export function PageTransitionShell({ children, mainClassName }: PageTransitionShellProps) {
  const chromeActive = usePageChromeActive();

  // Nested AppPageShell (client-persisted shell + streamed next page) must not re-mount header/footer.
  if (chromeActive) {
    return <>{children}</>;
  }

  return (
    <PageChromeActiveProvider>
      <PageTransitionProvider>
        <PageTransitionCanvas mainClassName={mainClassName}>{children}</PageTransitionCanvas>
      </PageTransitionProvider>
    </PageChromeActiveProvider>
  );
}
