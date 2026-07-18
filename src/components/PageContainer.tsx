import { clsx } from "clsx";
import type { ElementType, ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  /** Rendered element — defaults to div (use "section", "header", etc. as needed). */
  as?: ElementType;
};

/**
 * Centralized page-width wrapper. Single source of truth for content
 * max-width and horizontal gutters, shared with the site header bar via the
 * `--page-max-width` / `--page-gutter` CSS variables (see `.page-container`
 * in globals.css). Use this (or the `page-container` class directly) for any
 * top-level page section so every block shares the same edges.
 */
export function PageContainer({ children, className, as: Tag = "div" }: PageContainerProps) {
  return <Tag className={clsx("page-container", className)}>{children}</Tag>;
}
