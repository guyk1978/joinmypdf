"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { blogArticlePath } from "@/lib/blog-article-path";
import { Link } from "@/i18n/navigation";

type BlogArticleLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  slug: string;
  /** Kept for call-site compatibility; unused (full-page navigation only). */
  title?: string;
  children: ReactNode;
  prefetch?: boolean;
};

/**
 * Canonical navigation to `/blog/[slug]` — always a standalone full-page route
 * (header + footer), never a modal or soft overlay.
 */
export function BlogArticleLink({
  slug,
  title: _title,
  children,
  prefetch = false,
  onClick,
  ...rest
}: BlogArticleLinkProps) {
  const href = blogArticlePath(slug);

  return (
    <Link href={href} prefetch={prefetch} {...rest} onClick={onClick}>
      {children}
    </Link>
  );
}
