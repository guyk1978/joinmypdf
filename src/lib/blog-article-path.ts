/** Canonical full-page article path used by SEO, deep links, and in-app navigation. */
export function blogArticlePath(slug: string): string {
  return `/blog/${slug}`;
}
