import type { BlogPost } from "@/lib/types";

export function getGuideExcerpt(post: BlogPost): string {
  return (
    post.description?.trim() ||
    post.contentBlocks?.intro?.trim() ||
    post.seo?.metaDescription?.trim() ||
    ""
  );
}
