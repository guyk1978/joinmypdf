import type { BlogPost, BlogRegistry } from "./types";

/** Merge blog registries; later entries override same slug. */
export function mergeBlogRegistry(...sources: BlogRegistry[]): BlogRegistry {
  const bySlug = new Map<string, BlogPost>();
  for (const source of sources) {
    for (const post of source.blog || []) {
      if (post?.slug) bySlug.set(post.slug, post);
    }
  }
  return { blog: [...bySlug.values()] };
}
