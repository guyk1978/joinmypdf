import { LocalProcessingInfographic } from "@/components/LocalProcessingInfographic";
import { ToolBeforeYouStart } from "@/components/ToolBeforeYouStart";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { Link } from "@/i18n/navigation";
import { blogArticlePath } from "@/lib/blog-article-path";
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
  const howTo = tool.documentation?.howTo;

  return (
    <>
      <ToolPageDashboardSection>
        <ToolBeforeYouStart title={beforeYouStartTitle}>
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {howTo?.steps?.length ? (
            <div className="tool-howto mt-6">
              <h3 className="mb-3 font-sans text-base font-semibold tracking-wide text-white">
                {howTo.name}
              </h3>
              <ol className="tool-howto__list m-0 list-decimal space-y-3 ps-5 text-neutral-300">
                {howTo.steps.map((step, index) => (
                  <li
                    key={`${step.name}-${index}`}
                    id={`howto-step-${index + 1}`}
                    className="tool-howto__step ps-1 leading-relaxed"
                  >
                    <span className="font-medium text-neutral-200">{step.name}.</span>{" "}
                    {step.text}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
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
            className="tools-hub-link-list__title mb-4"
          >
            {relatedGuidesTitle}
          </h2>
          <ul className="tools-hub-link-list">
            {articles.map((article) => (
              <li key={article.slug} className="tools-hub-link-list__item">
                <Link
                  className="tools-hub-link-list__link"
                  href={blogArticlePath(article.slug)}
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
            href={blogArticlePath(seoOverride.featuredGuide.slug)}
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
