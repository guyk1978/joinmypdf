import { LocalProcessingInfographic } from "@/components/LocalProcessingInfographic";
import { ToolBeforeYouStart } from "@/components/ToolBeforeYouStart";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { Link } from "@/i18n/navigation";
import type { ToolListEntry } from "@/lib/tool-module";
import type { ToolSeoBenefitCard, ToolSeoPageOverride } from "@/lib/tool-seo-overrides";

type AudioToolMarketingSectionsProps = {
  tool: ToolListEntry;
  paragraphs: string[];
  seoOverride: ToolSeoPageOverride | null;
  beforeYouStartTitle: string;
  whySectionTitle: string;
  whySectionSubheadline?: string;
  whyBenefits?: ToolSeoBenefitCard[];
};

export function AudioToolMarketingSections({
  paragraphs,
  seoOverride,
  beforeYouStartTitle,
  whySectionTitle,
  whySectionSubheadline,
  whyBenefits,
}: AudioToolMarketingSectionsProps) {
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
    </>
  );
}
