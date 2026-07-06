"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { HomePageFooter } from "@/components/HomePageFooter";
import { FooterToolsPanel } from "@/components/FooterToolsPanel";
import { PageContentTransition } from "@/components/PageContentTransition";
import { SiteHeader } from "@/components/SiteHeader";
import { PageTransitionProvider, usePageTransition } from "@/context/PageTransitionContext";

type PageTransitionShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

function PageTransitionCanvas({ children, mainClassName }: PageTransitionShellProps) {
  const { handleLinkClickCapture } = usePageTransition();

  return (
    <div className="app-page-canvas" onClickCapture={handleLinkClickCapture}>
      <SiteHeader />
      <main className={clsx("home-tool-grid-page flex-1", mainClassName)}>
        <PageContentTransition className="page-content-transition--main">{children}</PageContentTransition>
      </main>
      <FooterToolsPanel />
      <HomePageFooter />
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
