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
    <section className="mt-10 border-t border-[#262626] pt-8" aria-labelledby={sectionId}>
      <h2 id={sectionId} className="text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {posts.map((post) => {
          const readTime = getLocalizedBlogReadTime(post, tBlog);

          return (
            <li key={post.slug} className="border-b border-[#1a1a1a] pb-3 last:border-b-0 last:pb-0">
              <Link href={blogArticlePath(post.slug)} className="group block" prefetch={false}>
                <span className="text-base font-medium text-white transition-colors group-hover:text-[#d4d4d4]">
                  {post.title}
                </span>
                {readTime ? (
                  <span className="mt-1 block text-xs uppercase tracking-widest text-[#737373]">{readTime}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
