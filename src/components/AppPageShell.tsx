import { clsx } from "clsx";
import type { ReactNode } from "react";
import { HomePageFooter } from "@/components/HomePageFooter";
import { PageContentTransition } from "@/components/PageContentTransition";
import { SiteHeader } from "@/components/SiteHeader";

type AppPageShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
};

/** Unified dark minimalist page shell — header, main, footer. */
export function AppPageShell({ children, className, mainClassName }: AppPageShellProps) {
  return (
    <div className={clsx("app-page-shell", className)}>
      <div className="app-page-canvas">
        <SiteHeader />
        <main className={clsx("home-tool-grid-page flex-1", mainClassName)}>
          <PageContentTransition className="page-content-transition--main">{children}</PageContentTransition>
        </main>
        <HomePageFooter />
      </div>
    </div>
  );
}
