"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { HomePageFooter } from "@/components/HomePageFooter";
import { PageContentTransition } from "@/components/PageContentTransition";
import { PdfReaderPromoBanner } from "@/components/PdfReaderPromoBanner";
import { PinnedCardsDock } from "@/components/PinnedCardsDock";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolIntroSideBanners } from "@/components/ToolIntroSideBanners";
import { ToolEmbedModeMarker } from "@/components/tool-modal/ToolEmbedModeMarker";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { PageTransitionProvider, usePageTransition } from "@/context/PageTransitionContext";
import { usePathname } from "@/i18n/navigation";

type PageTransitionShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

function shouldShowPdfReaderPromo(pathname: string): boolean {
  if (pathname === "/home" || pathname.startsWith("/home/")) return true;
  const segs = pathname.split("/").filter(Boolean);
  if (segs[0] !== "tools") return false;
  if (segs.length === 1) return true;
  if (segs.length === 2) {
    const segment = segs[1];
    return segment.endsWith("-tools") || segment === "unit-converters";
  }
  return false;
}

function PageTransitionCanvas({ children, mainClassName }: PageTransitionShellProps) {
  const { handleLinkClickCapture } = usePageTransition();
  const embed = useToolEmbedMode();
  const pathname = usePathname() || "/";
  const showPromo = !embed && shouldShowPdfReaderPromo(pathname);

  return (
    <div
      className={clsx("app-page-canvas", embed && "app-page-canvas--tool-embed")}
      onClickCapture={handleLinkClickCapture}
    >
      <ToolEmbedModeMarker />
      <ToolIntroSideBanners />
      {embed ? null : <SiteHeader />}
      {embed ? null : <PinnedCardsDock />}
      <main
        className={clsx(
          "home-tool-grid-page flex min-h-0 w-full flex-1 flex-col",
          embed && "h-full max-w-none",
          mainClassName,
        )}
      >
        {showPromo ? (
          <PdfReaderPromoBanner
            className={
              pathname === "/home" || pathname.startsWith("/home/")
                ? "pdf-reader-promo--home"
                : "pdf-reader-promo--hub"
            }
          />
        ) : null}
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
  return (
    <PageTransitionProvider>
      <PageTransitionCanvas mainClassName={mainClassName}>{children}</PageTransitionCanvas>
    </PageTransitionProvider>
  );
}
