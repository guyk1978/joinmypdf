import { BlogArticleCard } from "@/components/BlogArticleCard";
import { BlogTrendingSidebar } from "@/components/BlogTrendingSidebar";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import {
  type BlogDisplayCategory,
  resolveBlogSubcategory,
} from "@/lib/blog-categories";
import { getGuideExcerpt } from "@/lib/blog-excerpt";
import {
  blogCategorySectionId,
  groupBlogPostsByCategory,
} from "@/lib/blog-index";
import { getMustReadBlogPosts } from "@/lib/blog-related";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";
import type { BlogPost } from "@/lib/types";
import { getTranslations } from "next-intl/server";

type BlogMagazineIndexProps = {
  posts: BlogPost[];
};

const SIDEBAR_GUIDES_COUNT = 15;

/**
 * Blog index — authority intro lives in ProductPageLayout H1.
 * Body renders crawlable category clusters with every article link in the HTML
 * (no load-more truncation that hides URLs from crawlers).
 */
export async function BlogMagazineIndex({ posts }: BlogMagazineIndexProps) {
  if (!posts.length) return null;

  const [t, tTools] = await Promise.all([
    getTranslations("Blog"),
    getTranslations("Tools"),
  ]);
  const topGuides = getMustReadBlogPosts(posts, new Set(), SIDEBAR_GUIDES_COUNT);
  const sections = groupBlogPostsByCategory(posts);

  const topGuideItems = topGuides.map((post) => ({
    slug: post.slug,
    title: post.title,
    readTime: getLocalizedBlogReadTime(post, t),
  }));

  return (
    <div className="blog-magazine-index">
      <div className="blog-magazine-index__layout">
        <div className="blog-magazine-index__main blog-magazine-feed">
          <header className="blog-magazine-feed__head">
            <div>
              <p className="blog-magazine-feed__eyebrow">{t("curatedTopicsEyebrow")}</p>
              <p className="blog-magazine-feed__title">{t("clustersHeading")}</p>
            </div>
            <nav className="blog-cluster-nav" aria-label={t("categoryNavLabel")}>
              <ul className="blog-cluster-nav__list">
                {sections.map((section) => (
                  <li key={section.category}>
                    <a
                      className="blog-cluster-nav__link"
                      href={`#${blogCategorySectionId(section.category)}`}
                    >
                      {t(`categories.${section.category}`)}
                      <span className="blog-cluster-nav__count">
                        {section.posts.length}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          {sections.map((section) => (
            <BlogCategoryCluster
              key={section.category}
              category={section.category}
              posts={section.posts}
              heading={t(`categories.${section.category}`)}
              countLabel={t("categoryArticleCount", { count: section.posts.length })}
              t={t}
              tTools={tTools}
            />
          ))}
        </div>

        <BlogTrendingSidebar posts={topGuideItems} className="blog-magazine-index__aside" />
      </div>
    </div>
  );
}

function BlogCategoryCluster({
  category,
  posts,
  heading,
  countLabel,
  t,
  tTools,
}: {
  category: BlogDisplayCategory;
  posts: BlogPost[];
  heading: string;
  countLabel: string;
  t: Awaited<ReturnType<typeof getTranslations<"Blog">>>;
  tTools: Awaited<ReturnType<typeof getTranslations<"Tools">>>;
}) {
  return (
    <section
      id={blogCategorySectionId(category)}
      className="blog-category-cluster"
      aria-labelledby={`${blogCategorySectionId(category)}-title`}
    >
      <header className="blog-category-cluster__head">
        <h2
          id={`${blogCategorySectionId(category)}-title`}
          className="blog-category-cluster__title"
        >
          {heading}
        </h2>
        <p className="blog-category-cluster__count">{countLabel}</p>
      </header>

      <ul className="blog-magazine-feed__list blog-category-cluster__list">
        {posts.map((post) => {
          const subCategory = resolveBlogSubcategory(post);
          return (
            <li key={post.slug}>
              <BlogArticleCard
                slug={post.slug}
                title={post.title}
                excerpt={getGuideExcerpt(post)}
                category={category}
                categoryLabel={getLocalizedBlogCategoryLabel(post, t)}
                subCategoryLabel={resolveInventoryToolLabel(subCategory, tTools)}
                readTime={getLocalizedBlogReadTime(post, t)}
                publishDate={post.publishDate}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
