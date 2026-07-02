"use client";

import { usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type PageContentTransitionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Fades main page content on client-side navigations only.
 * Skips the first paint so SSR/LCP content is not delayed or hidden.
 */
export function PageContentTransition({ children, className }: PageContentTransitionProps) {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const shouldAnimate = previousPathname.current !== null && previousPathname.current !== pathname;

  useEffect(() => {
    previousPathname.current = pathname;
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={clsx(
        "page-content-transition",
        shouldAnimate && "page-content-transition--enter",
        className,
      )}
    >
      {children}
    </div>
  );
}
