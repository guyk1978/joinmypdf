import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { homeCategoryAccentStyle } from "@/components/homepage/home-accent";
import { blogArticlePath } from "@/lib/blog-article-path";
import { getBlogRegistry } from "@/lib/blog-registry";

/** Curated evergreen guides; falls back to the first registry posts. */
const FEATURED_GUIDE_SLUGS = [
  "how-to-safely-sign-contracts-online",
  "hidden-risks-of-free-online-pdf-editors",
];

const GUIDE_ACCENTS = ["security", "pdf"] as const;

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
          {guides.map((post, index) => {
            const accentStyle = homeCategoryAccentStyle(
              GUIDE_ACCENTS[index % GUIDE_ACCENTS.length]!,
            ) as CSSProperties;

            return (
              <Link
                key={post.slug}
                href={blogArticlePath(post.slug)}
                prefetch={false}
                style={accentStyle}
                className="home-accent-card group flex items-start gap-4 rounded-2xl p-5 hover:-translate-y-0.5"
              >
                <span
                  aria-hidden
                  className="home-accent-card__icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                >
                  <BookOpen size={20} strokeWidth={1.75} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="home-accent-card__title text-sm font-semibold leading-snug">
                    {post.title}
                  </span>
                  {post.description ? (
                    <span className="home-accent-card__desc text-xs leading-relaxed">
                      {truncateSnippet(post.description)}
                    </span>
                  ) : null}
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400">
                    {post.readTime ?? t("landing.guidesReadTime")}
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1 text-[color:var(--category-accent)] transition-colors duration-200 group-hover:brightness-125">
                      {t("landing.guidesCta")}
                      <ArrowUpRight size={12} strokeWidth={2} aria-hidden />
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </HomeReveal>
  );
}
