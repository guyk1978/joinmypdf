import { getTranslations } from "next-intl/server";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { blogArticlePath } from "@/lib/blog-article-path";
import { getBlogRegistry } from "@/lib/blog-registry";

/** Curated evergreen guides; falls back to the first registry posts. */
const FEATURED_GUIDE_SLUGS = [
  "how-to-safely-sign-contracts-online",
  "hidden-risks-of-free-online-pdf-editors",
];

const SNIPPET_MAX_LENGTH = 120;

type WorkflowGuidesProps = {
  locale: string;
};

function truncateSnippet(text: string): string {
  if (text.length <= SNIPPET_MAX_LENGTH) return text;
  const cut = text.slice(0, SNIPPET_MAX_LENGTH);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 60))}…`;
}

/**
 * "Workflow Guides" — two horizontal cards linking into the existing blog
 * articles, matching the Popular Tools section width.
 */
export async function WorkflowGuides({ locale }: WorkflowGuidesProps) {
  const t = await getTranslations("Home");
  const posts = getBlogRegistry(locale).blog;

  const featured = FEATURED_GUIDE_SLUGS.map((slug) =>
    posts.find((post) => post.slug === slug),
  ).filter((post) => post != null);
  const guides = (featured.length >= 2 ? featured : posts).slice(0, 2);

  if (!guides.length) return null;

  return (
    <HomeReveal className="w-full">
      <section aria-labelledby="workflow-guides-title" className="w-full mb-10">
        <h2
          id="workflow-guides-title"
          className="mb-5 flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <BookOpen size={18} strokeWidth={1.75} aria-hidden className="text-neutral-400" />
          {t("landing.guidesTitle")}
        </h2>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          {guides.map((post) => (
            <Link
              key={post.slug}
              href={blogArticlePath(post.slug)}
              prefetch={false}
              className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              <span
                aria-hidden
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/80 transition-colors duration-200 group-hover:border-white/20 group-hover:text-white"
              >
                <BookOpen size={20} strokeWidth={1.75} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-sm font-semibold leading-snug text-white">
                  {post.title}
                </span>
                {post.description ? (
                  <span className="text-xs leading-relaxed text-neutral-400">
                    {truncateSnippet(post.description)}
                  </span>
                ) : null}
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                  {post.readTime ?? t("landing.guidesReadTime")}
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 text-neutral-400 transition-colors duration-200 group-hover:text-white">
                    {t("landing.guidesCta")}
                    <ArrowUpRight size={12} strokeWidth={2} aria-hidden />
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </HomeReveal>
  );
}
