"use client";

import { useLocale, useTranslations } from "next-intl";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { blogArticlePath } from "@/lib/blog-article-path";
import { useArticleModal } from "@/components/ArticleModalProvider";
import { Link } from "@/i18n/navigation";

type BlogArticleLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  slug: string;
  title?: string;
  children: ReactNode;
  prefetch?: boolean;
};

/**
 * Soft-opens articles in ArticleModal when the provider is mounted (blog index).
 * Falls back to a normal canonical `/blog/[slug]` navigation elsewhere.
 */
export function BlogArticleLink({
  slug,
  title,
  children,
  prefetch = false,
  onClick,
  ...rest
}: BlogArticleLinkProps) {
  const locale = useLocale();
  const t = useTranslations("Blog");
  const modal = useArticleModal();
  const href = blogArticlePath(slug);
  const absoluteHref = `/${locale}${href}`;

  const openSoft = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (event.button !== 0) return false;
    event.preventDefault();
    event.stopPropagation();
    modal?.openArticleModal({
      slug,
      href: absoluteHref,
      title: title || (typeof children === "string" ? children : t("articleModalFallbackTitle")),
    });
    return true;
  };

  // Prefer a plain anchor under the modal provider so Next soft-nav cannot race preventDefault.
  if (modal) {
    return (
      <a
        href={absoluteHref}
        data-article-soft="1"
        {...rest}
        onMouseDown={(event) => {
          openSoft(event);
        }}
        onClick={(event) => {
          onClick?.(event);
          openSoft(event);
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={prefetch} scroll={false} data-article-soft="0" {...rest} onClick={onClick}>
      {children}
    </Link>
  );
}
