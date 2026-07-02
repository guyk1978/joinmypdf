import { clsx } from "clsx";
import type { ReactNode } from "react";
import { PageTransitionShell } from "@/components/PageTransitionShell";

type AppPageShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
};

/** Unified dark minimalist page shell — header, main, footer. */
export function AppPageShell({ children, className, mainClassName }: AppPageShellProps) {
  return (
    <div className={clsx("app-page-shell", className)}>
      <PageTransitionShell mainClassName={mainClassName}>{children}</PageTransitionShell>
    </div>
  );
}
