import { LocalProcessingInfographic } from "@/components/LocalProcessingInfographic";
import { ToolBeforeYouStart } from "@/components/ToolBeforeYouStart";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { Link } from "@/i18n/navigation";
import type { BlogPost } from "@/lib/types";
import { getRelatedGuideLinkLabel } from "@/lib/tool-related-guides";
import type { ToolSeoBenefitCard, ToolSeoPageOverride } from "@/lib/tool-seo-overrides";
import type { ToolDefinition } from "@/lib/types";
import type { ToolPageTranslator } from "@/lib/i18n-tool-page";

type ToolMarketingSectionsProps = {
  tool: ToolDefinition;
  paragraphs: string[];
  articles: BlogPost[];
  seoOverride: ToolSeoPageOverride | null;
  beforeYouStartTitle: string;
  whySectionTitle: string;
  whySectionSubheadline?: string;
  whyBenefits?: ToolSeoBenefitCard[];
  relatedGuidesTitle: string;
  tPage: ToolPageTranslator;
};

export function ToolMarketingSections({
  tool,
  paragraphs,
  articles,
  seoOverride,
  beforeYouStartTitle,
  whySectionTitle,
  whySectionSubheadline,
  whyBenefits,
  relatedGuidesTitle,
  tPage,
}: ToolMarketingSectionsProps) {
  return (
    <>
      <ToolPageDashboardSection>
        <ToolBeforeYouStart title={beforeYouStartTitle}>
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </ToolBeforeYouStart>
      </ToolPageDashboardSection>

      <LocalProcessingInfographic
        layout="dashboard"
        headline={whySectionTitle}
        subheadline={whySectionSubheadline}
        benefits={whyBenefits}
      />

      {articles.length ? (
        <ToolPageDashboardSection aria-labelledby="related-guides-heading">
          <h2
            id="related-guides-heading"
            className="mb-4 text-lg font-semibold tracking-wide text-ink dark:text-white"
          >
            {relatedGuidesTitle}
          </h2>
          <ul className="space-y-3">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  className="text-base leading-relaxed text-neutral-400 hover:underline"
                  href={`/blog/${article.slug}/`}
                >
                  {getRelatedGuideLinkLabel(article, tPage)}
                </Link>
              </li>
            ))}
          </ul>
        </ToolPageDashboardSection>
      ) : null}

      {seoOverride?.featuredGuide ? (
        <ToolPageDashboardSection>
          <Link
            href={`/blog/${seoOverride.featuredGuide.slug}/`}
            className="text-base leading-relaxed text-neutral-300 hover:underline"
            prefetch={false}
          >
            {seoOverride.featuredGuide.label}
          </Link>
        </ToolPageDashboardSection>
      ) : null}

      {seoOverride?.relatedWorkflowLinks ? (
        <ToolPageDashboardSection>
          <p className="mb-3 text-base leading-relaxed text-neutral-400">
            {seoOverride.relatedWorkflowLinks.prompt}
          </p>
          <div className="tool-seo-workflow-links">
            {seoOverride.relatedWorkflowLinks.links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="tool-seo-workflow-links__link"
                prefetch={false}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </ToolPageDashboardSection>
      ) : null}

      {seoOverride?.complementaryTool ? (
        <ToolPageDashboardSection>
          <p className="text-base leading-relaxed text-neutral-400">
            {seoOverride.complementaryTool.prompt}{" "}
            <Link
              href={seoOverride.complementaryTool.href}
              className="font-medium text-neutral-300 hover:underline"
              prefetch={false}
            >
              {seoOverride.complementaryTool.linkLabel}
            </Link>
          </p>
        </ToolPageDashboardSection>
      ) : null}
    </>
  );
}
