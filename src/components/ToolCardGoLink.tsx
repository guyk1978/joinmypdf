"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import { localizeAppHref } from "@/lib/localize-app-href";

type ToolCardGoLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "target"
> & {
  href: string;
  children: ReactNode;
};

/**
 * Tool-card primary navigation — same-tab internal routing.
 * Uses a plain localized `<a>` (no next-intl/Next Link) so PageTransitionContext
 * can intercept clicks for in-app navigation.
 */
export function ToolCardGoLink({
  href,
  className,
  children,
  ...rest
}: ToolCardGoLinkProps) {
  const locale = useLocale();

  return (
    <a
      {...rest}
      href={localizeAppHref(href, locale)}
      className={clsx(className)}
    >
      {children}
    </a>
  );
}
