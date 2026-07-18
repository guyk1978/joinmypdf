/** Canonical article path used by deep links + intercepting modal soft navigation. */
export function blogArticlePath(slug: string): string {
  return `/article/${slug}`;
}
