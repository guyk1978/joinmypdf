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
  const isToolPage =
    typeof mainClassName === "string" && mainClassName.includes("tool-page-main");
  const toolWorkspace = isToolPage ? "1" : undefined;

  const main = (
    <main
      className={clsx(
        "home-tool-grid-page flex min-h-0 w-full flex-1 flex-col",
        embed && "h-full max-w-none",
        mainClassName,
      )}
      data-tool-workspace={toolWorkspace}
    >
      <PageContentTransition className="page-content-transition--main flex min-h-0 w-full flex-1 flex-col">
        {children}
      </PageContentTransition>
    </main>
  );

  return (
    <div
      className={clsx(
        "app-page-canvas flex min-h-0 w-full flex-1 flex-col",
        embed && "app-page-canvas--tool-embed",
        !embed && "app-page-canvas--dock-footer",
      )}
      onClickCapture={handleLinkClickCapture}
    >
      <ToolEmbedModeMarker />
      {embed ? (
        main
      ) : (
        <>
          {/* Header sticky top + footer fixed bottom (always visible chrome) */}
          <SiteHeader />
          {main}
          <HomePageFooter dock />
        </>
      )}
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


