"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { HomePageFooter } from "@/components/HomePageFooter";
import { PageContentTransition } from "@/components/PageContentTransition";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolEmbedModeMarker } from "@/components/tool-modal/ToolEmbedModeMarker";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
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
      className={clsx("app-page-canvas", embed && "app-page-canvas--tool-embed")}
      onClickCapture={handleLinkClickCapture}
    >
      <ToolEmbedModeMarker />
      {embed ? null : <SiteHeader />}
      <main className={clsx("home-tool-grid-page flex-1", mainClassName)}>
        <PageContentTransition className="page-content-transition--main">{children}</PageContentTransition>
      </main>
      {embed ? null : <HomePageFooter />}
    </div>
  );
}

/** Client shell: sequential exit → navigate → enter on main content only. */
export function PageTransitionShell({ children, mainClassName }: PageTransitionShellProps) {
  return (
    <PageTransitionProvider>
      <PageTransitionCanvas mainClassName={mainClassName}>{children}</PageTransitionCanvas>
    </PageTransitionProvider>
  );
}
