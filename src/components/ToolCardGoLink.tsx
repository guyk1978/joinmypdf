"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import { localizeAppHref } from "@/lib/localize-app-href";

type ToolCardGoLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

/**
 * Tool-card primary navigation — same-tab internal routing by default.
 * Pass `target="_top"` to force a full document navigation (break out of
 * ToolModal embed iframes / soft in-page swaps).
 */
export function ToolCardGoLink({
  href,
  className,
  children,
  target,
  ...rest
}: ToolCardGoLinkProps) {
  const locale = useLocale();

  return (
    <a
      {...rest}
      href={localizeAppHref(href, locale)}
      target={target}
      rel={target === "_top" ? "noopener" : rest.rel}
      className={clsx(className)}
    >
      {children}
    </a>
  );
}
