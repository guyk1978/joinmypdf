import { Link } from "@/i18n/navigation";
import { getLocalizedBlogReadTime } from "@/lib/blog-card-i18n";
import { blogArticlePath } from "@/lib/blog-article-path";
import type { BlogPost } from "@/lib/types";
import { getTranslations } from "next-intl/server";

type ToolsHubRelatedGuidesProps = {
  posts: BlogPost[];
  title: string;
  sectionId: string;
};

export async function ToolsHubRelatedGuides({ posts, title, sectionId }: ToolsHubRelatedGuidesProps) {
  if (!posts.length) return null;

  const tBlog = await getTranslations("Blog");

  return (
    <section className="tools-hub-related-guides" aria-labelledby={sectionId}>
      <h2 id={sectionId} className="tools-hub-link-list__title">
        {title}
      </h2>
      <ul className="tools-hub-link-list">
        {posts.map((post) => {
          const readTime = getLocalizedBlogReadTime(post, tBlog);

          return (
            <li key={post.slug} className="tools-hub-link-list__item">
              <Link href={blogArticlePath(post.slug)} className="tools-hub-link-list__link" prefetch={false}>
                <span className="tools-hub-link-list__label">{post.title}</span>
                {readTime ? (
                  <span className="tools-hub-link-list__meta">{readTime}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
