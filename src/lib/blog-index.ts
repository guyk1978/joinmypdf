import {
  BLOG_CATEGORY_ORDER,
  resolveBlogDisplayCategory,
  type BlogDisplayCategory,
} from "@/lib/blog-categories";
import type { BlogPost } from "@/lib/types";

export type BlogCategorySection = {
  category: BlogDisplayCategory;
  posts: BlogPost[];
};

export function groupBlogPostsByCategory(posts: BlogPost[]): BlogCategorySection[] {
  const buckets = new Map<BlogDisplayCategory, BlogPost[]>();

  for (const post of posts) {
    const category = resolveBlogDisplayCategory(post);
    const list = buckets.get(category) ?? [];
    list.push(post);
    buckets.set(category, list);
  }

  return BLOG_CATEGORY_ORDER.filter((category) => (buckets.get(category)?.length ?? 0) > 0).map(
    (category) => ({
      category,
      posts: (buckets.get(category) ?? []).sort(
        (a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""),
      ),
    }),
  );
}

export function blogCategorySectionId(category: BlogDisplayCategory): string {
  return `blog-category-${category}`;
}
