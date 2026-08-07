import { ToolRelatedToolsSection } from "@/components/ToolRelatedToolsSection";
import type { ToolDefinition } from "@/lib/types";

type RelatedToolsProps = {
  tool?: ToolDefinition;
  /** When SEO registry tool is unavailable (dedicated pages). */
  slug?: string;
};

/**
 * RELATED-tab related tools — same minimal stripe cards as under Overview.
 */
export function RelatedTools({ tool, slug }: RelatedToolsProps) {
  const toolSlug = tool?.slug ?? slug;
  if (!toolSlug) return null;

  return (
    <ToolRelatedToolsSection
      slug={toolSlug}
      relatedSlugs={tool?.relatedTools ?? []}
      limit={8}
      className="tool-related-tools--pane"
    />
  );
}
