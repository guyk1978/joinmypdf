"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import { localizeAppHref } from "@/lib/localize-app-href";

type ToolCardGoLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "target" | "rel"
> & {
  href: string;
  children: ReactNode;
};

/**
 * Tool-card primary navigation — always a native new browser tab.
 * Uses a plain `<a target="_blank">` (no next-intl/Next Link, no window.open).
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
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(className)}
    >
      {children}
    </a>
  );
}
