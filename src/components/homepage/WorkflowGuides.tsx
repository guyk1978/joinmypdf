import { getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeGuideCard } from "@/components/homepage/HomeGuideCard";
import { HomeSection } from "@/components/homepage/HomeSection";
import { HOME_SECTION_MAX_ITEMS } from "@/components/homepage/home-section";
import { blogArticlePath } from "@/lib/blog-article-path";
import { getBlogRegistry } from "@/lib/blog-registry";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

/** Curated evergreen guides; remaining slots fill from the blog registry. */
const FEATURED_GUIDE_SLUGS = [
  "how-to-safely-sign-contracts-online",
  "hidden-risks-of-free-online-pdf-editors",
];

const GUIDE_ACCENTS = [
  "security",
  "pdf",
  "convert",
  "image",
  "text",
] as const satisfies readonly InventoryCategoryId[];

const SNIPPET_MAX_LENGTH = 160;

type WorkflowGuidesProps = {
  locale: string;
};

function truncateSnippet(text: string): string {
  if (text.length <= SNIPPET_MAX_LENGTH) return text;
  const cut = text.slice(0, SNIPPET_MAX_LENGTH);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 60))}…`;
}

/**
 * "Workflow Guides" — up to 20 guide cards matching category card chrome.
 */
export async function WorkflowGuides({ locale }: WorkflowGuidesProps) {
  const t = await getTranslations("Home");
  const posts = getBlogRegistry(locale).blog;

  const featured = FEATURED_GUIDE_SLUGS.map((slug) =>
    posts.find((post) => post.slug === slug),
  ).filter((post) => post != null);

  const featuredSlugs = new Set(featured.map((post) => post.slug));
  const rest = posts.filter((post) => !featuredSlugs.has(post.slug));
  const guides = [...featured, ...rest].slice(0, HOME_SECTION_MAX_ITEMS);

  if (!guides.length) return null;

  return (
    <HomeReveal className="w-full">
      <HomeSection
        id="workflow-guides-title"
        title={t("landing.guidesTitle")}
        icon={<BookOpen size={22} strokeWidth={1.75} />}
      >
        {guides.map((post, index) => (
          <HomeGuideCard
            key={post.slug}
            href={blogArticlePath(post.slug)}
            label={post.title}
            description={post.description ? truncateSnippet(post.description) : undefined}
            readTime={post.readTime ?? t("landing.guidesReadTime")}
            openLabel={t("landing.guidesCta")}
            categoryId={GUIDE_ACCENTS[index % GUIDE_ACCENTS.length]}
            icon={<BookOpen size={20} strokeWidth={1.75} aria-hidden />}
          />
        ))}
      </HomeSection>
    </HomeReveal>
  );
}
