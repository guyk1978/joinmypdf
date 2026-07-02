import { BlogCategoryNav } from "@/components/BlogCategoryNav";
import { BlogGuideListItem } from "@/components/BlogGuideListItem";
import { ToolCardGrid } from "@/components/ToolCardGrid";
import { getLocalizedBlogCategoryLabelById } from "@/lib/blog-card-i18n";
import { blogCategorySectionId, groupBlogPostsByCategory } from "@/lib/blog-index";
import type { BlogPost } from "@/lib/types";
import { getTranslations } from "next-intl/server";

type BlogCategorizedIndexProps = {
  posts: BlogPost[];
};

export async function BlogCategorizedIndex({ posts }: BlogCategorizedIndexProps) {
  const t = await getTranslations("Blog");
  const sections = groupBlogPostsByCategory(posts);

  if (!sections.length) return null;

  return (
    <div className="blog-categorized-index">
      <BlogCategoryNav categories={sections.map((section) => section.category)} />

      <div className="blog-categorized-index__sections">
        {sections.map((section) => {
          const sectionLabel = getLocalizedBlogCategoryLabelById(section.category, t);

          return (
            <section
              key={section.category}
              id={blogCategorySectionId(section.category)}
              className="blog-category-section"
              aria-labelledby={`blog-category-title-${section.category}`}
            >
              <header className="blog-category-section__header">
                <h2 id={`blog-category-title-${section.category}`} className="blog-category-section__title">
                  {sectionLabel}
                </h2>
                <p className="blog-category-section__count">
                  {t("categoryArticleCount", { count: section.posts.length })}
                </p>
              </header>

              <ToolCardGrid className="tool-card-grid--directory blog-index-grid">
                {section.posts.map((post) => (
                  <BlogGuideListItem key={post.slug} post={post} showCategoryBadge={false} />
                ))}
              </ToolCardGrid>
            </section>
          );
        })}
      </div>
    </div>
  );
}
