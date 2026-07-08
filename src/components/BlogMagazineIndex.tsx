import { BlogFeaturedSpotlight } from "@/components/BlogFeaturedSpotlight";
import { BlogMagazineFeed, type BlogMagazineFeedItem } from "@/components/BlogMagazineFeed";
import { BlogTrendingSidebar } from "@/components/BlogTrendingSidebar";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import { resolveBlogDisplayCategory } from "@/lib/blog-categories";
import { resolveBlogCardCoverImage } from "@/lib/blog-cover-image";
import { getGuideExcerpt } from "@/lib/blog-excerpt";
import { groupBlogPostsByCategory } from "@/lib/blog-index";
import { getFeaturedBlogPosts, getMustReadBlogPosts } from "@/lib/blog-related";
import type { BlogPost } from "@/lib/types";
import { getTranslations } from "next-intl/server";

type BlogMagazineIndexProps = {
  posts: BlogPost[];
};

export async function BlogMagazineIndex({ posts }: BlogMagazineIndexProps) {
  if (!posts.length) return null;

  const t = await getTranslations("Blog");
  const featured = getFeaturedBlogPosts(posts, 3);
  const featuredSlugs = new Set(featured.map((post) => post.slug));
  const mustRead = getMustReadBlogPosts(posts, featuredSlugs, 5);
  const sections = groupBlogPostsByCategory(posts);
  const categories = sections.map((section) => section.category);

  const feedItems: BlogMagazineFeedItem[] = posts
    .filter((post) => !featuredSlugs.has(post.slug))
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: getGuideExcerpt(post),
      category: resolveBlogDisplayCategory(post),
      categoryLabel: getLocalizedBlogCategoryLabel(post, t),
      readTime: getLocalizedBlogReadTime(post, t),
      coverImage: resolveBlogCardCoverImage(post),
    }));

  return (
    <div className="blog-magazine-index">
      <BlogFeaturedSpotlight posts={featured} />

      <div className="blog-magazine-index__layout">
        <div className="blog-magazine-index__main">
          <BlogMagazineFeed items={feedItems} categories={categories} />
        </div>
        <BlogTrendingSidebar posts={mustRead} className="blog-magazine-index__aside" />
      </div>
    </div>
  );
}
