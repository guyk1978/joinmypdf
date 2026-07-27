import { getTranslations } from "next-intl/server";
import { BookOpen, ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeStaticPanel } from "@/components/homepage/HomeStaticPanel";
import { blogArticlePath } from "@/lib/blog-article-path";
import { getBlogRegistry } from "@/lib/blog-registry";

const FEATURED_GUIDE_SLUGS = [
  "how-to-safely-sign-contracts-online",
  "hidden-risks-of-free-online-pdf-editors",
];

const SNIPPET_MAX_LENGTH = 280;

const TAKEAWAY_KEYS = [
  "landing.spotlightTakeaway1",
  "landing.spotlightTakeaway2",
  "landing.spotlightTakeaway3",
] as const;

type WorkflowSpotlightProps = {
  locale: string;
};

function truncateSnippet(text: string): string {
  if (text.length <= SNIPPET_MAX_LENGTH) return text;
  const cut = text.slice(0, SNIPPET_MAX_LENGTH);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 100))}…`;
}

/**
 * Featured guide / expert article card for the homepage 50/50 spotlight column.
 */
export async function WorkflowSpotlight({ locale }: WorkflowSpotlightProps) {
  const t = await getTranslations("Home");
  const posts = getBlogRegistry(locale).blog;

  const featured =
    FEATURED_GUIDE_SLUGS.map((slug) => posts.find((post) => post.slug === slug)).find(
      (post) => post != null,
    ) ?? posts[0];

  if (!featured) return null;

  const href = blogArticlePath(featured.slug);
  const body = featured.description
    ? truncateSnippet(featured.description)
    : t("landing.spotlightFallback");

  return (
    <HomeReveal className="w-full h-full">
      <HomeStaticPanel
        id="workflow-spotlight-title"
        title={t("landing.spotlightTitle")}
        icon={<BookOpen size={26} strokeWidth={1.75} />}
        className="home-static-panel--spotlight"
        bodyClassName="home-spotlight"
      >
        <article className="home-spotlight__card">
          <p className="home-spotlight__eyebrow">{t("landing.spotlightEyebrow")}</p>
          <h3 className="home-spotlight__title">{featured.title}</h3>
          <p className="home-spotlight__body">{body}</p>

          <div className="home-spotlight__takeaways">
            <p className="home-spotlight__takeaways-label">
              {t("landing.spotlightTakeawaysLabel")}
            </p>
            <ul className="home-spotlight__takeaways-list">
              {TAKEAWAY_KEYS.map((key) => (
                <li key={key} className="home-spotlight__takeaway">
                  <span className="home-spotlight__takeaway-icon" aria-hidden>
                    <Check size={15} strokeWidth={2.25} />
                  </span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="home-spotlight__meta">
            <span>{featured.readTime ?? t("landing.guidesReadTime")}</span>
          </div>
          <Link href={href} className="home-spotlight__cta" prefetch={false}>
            <span>{t("landing.guidesCta")}</span>
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </Link>
        </article>
      </HomeStaticPanel>
    </HomeReveal>
  );
}
