import { clsx } from "clsx";
import type { ReactNode } from "react";
import { PageTransitionShell } from "@/components/PageTransitionShell";

type AppPageShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
};

/** Unified dark minimalist page shell — header, main, footer.
 * Viewport min-height floor lives in globals.css (.app-page-shell) — once only.
 */
export function AppPageShell({ children, className, mainClassName }: AppPageShellProps) {
  return (
    <div className={clsx("app-page-shell flex w-full flex-1 flex-col", className)}>
      <PageTransitionShell mainClassName={mainClassName}>{children}</PageTransitionShell>
    </div>
  );
}
