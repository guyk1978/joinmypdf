/** Canonical full-page article path used by SEO, deep links, and in-app navigation. */
export function blogArticlePath(slug: string): string {
  return `/blog/${slug}`;
}

/** Locale-prefixed article path matching `trailingSlash: false` and canonical URLs. */
export function localizedBlogArticlePath(locale: string, slug: string): string {
  return `/${locale}${blogArticlePath(slug)}`.replace(/\/+$/, "");
}
