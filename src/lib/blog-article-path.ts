/** Canonical article path used by SEO, deep links, and modal soft navigation. */
export function blogArticlePath(slug: string): string {
  return `/blog/${slug}`;
}
