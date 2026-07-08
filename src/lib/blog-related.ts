import { resolveBlogDisplayCategory } from "@/lib/blog-categories";
import type { BlogPost } from "@/lib/types";

export function getFeaturedBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .sort((a, b) => {
      const tierDiff = Number(Boolean(b.tier1)) - Number(Boolean(a.tier1));
      if (tierDiff !== 0) return tierDiff;
      return Date.parse(b.publishDate || "") - Date.parse(a.publishDate || "");
    })
    .slice(0, limit);
}

export function getMustReadBlogPosts(
  posts: BlogPost[],
  excludeSlugs: ReadonlySet<string>,
  limit = 5,
): BlogPost[] {
  return [...posts]
    .filter((post) => !excludeSlugs.has(post.slug))
    .sort((a, b) => {
      const score = (post: BlogPost) =>
        Number(Boolean(post.tier1)) * 2 +
        Number((post.contentBlocks?.wordCount || 0) >= 500) +
        Date.parse(post.publishDate || "") / 1e12;
      return score(b) - score(a);
    })
    .slice(0, limit);
}

export function getRelatedBlogPosts(
  current: BlogPost,
  allPosts: BlogPost[],
  limit = 4,
): BlogPost[] {
  const seen = new Set<string>([current.slug]);
  const results: BlogPost[] = [];

  const push = (post: BlogPost | undefined) => {
    if (!post || seen.has(post.slug) || results.length >= limit) return;
    results.push(post);
    seen.add(post.slug);
  };

  for (const slug of current.relatedBlogs || []) {
    push(allPosts.find((entry) => entry.slug === slug));
  }

  const category = resolveBlogDisplayCategory(current);
  const sameCategory = allPosts
    .filter((entry) => resolveBlogDisplayCategory(entry) === category)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""));

  for (const post of sameCategory) {
    push(post);
    if (results.length >= limit) break;
  }

  const toolSet = new Set(current.relatedTools || []);
  if (toolSet.size > 0) {
    for (const post of allPosts) {
      if (results.length >= limit) break;
      if (seen.has(post.slug)) continue;
      if ((post.relatedTools || []).some((tool) => toolSet.has(tool))) {
        push(post);
      }
    }
  }

  return results;
}

export function getYouMightAlsoLikePosts(
  current: BlogPost,
  allPosts: BlogPost[],
  excludeSlugs: ReadonlySet<string>,
  limit = 4,
): BlogPost[] {
  const seen = new Set<string>([current.slug, ...excludeSlugs]);
  const results: BlogPost[] = [];

  const push = (post: BlogPost | undefined) => {
    if (!post || seen.has(post.slug) || results.length >= limit) return;
    results.push(post);
    seen.add(post.slug);
  };

  const cluster = current.cluster?.trim();
  if (cluster) {
    for (const post of allPosts) {
      if (results.length >= limit) break;
      if (seen.has(post.slug)) continue;
      if (post.cluster === cluster) push(post);
    }
  }

  const category = resolveBlogDisplayCategory(current);
  for (const post of allPosts) {
    if (results.length >= limit) break;
    if (seen.has(post.slug)) continue;
    if (resolveBlogDisplayCategory(post) === category) push(post);
  }

  for (const post of allPosts) {
    if (results.length >= limit) break;
    if (post.tier1) push(post);
  }

  return results;
}
