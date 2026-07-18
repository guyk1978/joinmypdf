import { BlogMagazineFeed, type BlogMagazineFeedItem } from "@/components/BlogMagazineFeed";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import {
  resolveBlogDisplayCategory,
  resolveBlogSubcategory,
} from "@/lib/blog-categories";
import { getGuideExcerpt } from "@/lib/blog-excerpt";
import { groupBlogPostsByCategory } from "@/lib/blog-index";
import { getMustReadBlogPosts } from "@/lib/blog-related";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";
import type { BlogPost } from "@/lib/types";
import { getTranslations } from "next-intl/server";

type BlogMagazineIndexProps = {
  posts: BlogPost[];
};

const SIDEBAR_GUIDES_COUNT = 15;

/**
 * Blog index — documentation-style two-column layout:
 * dense article list (main) + sticky Top Guides rail (aside).
 */
export async function BlogMagazineIndex({ posts }: BlogMagazineIndexProps) {
  if (!posts.length) return null;

  const [t, tTools] = await Promise.all([
    getTranslations("Blog"),
    getTranslations("Tools"),
  ]);
  const topGuides = getMustReadBlogPosts(posts, new Set(), SIDEBAR_GUIDES_COUNT);
  const sections = groupBlogPostsByCategory(posts);
  const categories = sections.map((section) => section.category);

  const feedItems: BlogMagazineFeedItem[] = [...posts]
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .map((post) => {
      const subCategory = resolveBlogSubcategory(post);
      return {
        slug: post.slug,
        title: post.title,
        excerpt: getGuideExcerpt(post),
        category: resolveBlogDisplayCategory(post),
        categoryLabel: getLocalizedBlogCategoryLabel(post, t),
        subCategory,
        subCategoryLabel: resolveInventoryToolLabel(subCategory, tTools),
        readTime: getLocalizedBlogReadTime(post, t),
        coverImage: null,
      };
    });

  const topGuideItems = topGuides.map((post) => ({
    slug: post.slug,
    title: post.title,
    readTime: getLocalizedBlogReadTime(post, t),
  }));

  return (
    <div className="blog-magazine-index">
      <BlogMagazineFeed
        items={feedItems}
        categories={categories}
        topGuides={topGuideItems}
      />
    </div>
  );
}
