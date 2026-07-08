import type { BlogPost } from "@/lib/types";

const PLACEHOLDER_COVER_PATTERNS = [
  /\/assets\/images\/blog\/og-default\.jpg$/i,
  /\/assets\/images\/blog\/default/i,
];

/** True when the post has a real, article-specific cover (not a registry placeholder). */
export function hasExplicitBlogCoverImage(post: Pick<BlogPost, "coverImage">): boolean {
  const src = post.coverImage?.trim();
  if (!src) return false;
  return !PLACEHOLDER_COVER_PATTERNS.some((pattern) => pattern.test(src));
}

/** Cover URL for card thumbnails, or null when the generator should render. */
export function resolveBlogCardCoverImage(
  post: Pick<BlogPost, "coverImage">,
): string | null {
  return hasExplicitBlogCoverImage(post) ? post.coverImage!.trim() : null;
}
