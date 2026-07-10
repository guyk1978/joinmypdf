import { getTranslations } from "next-intl/server";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { toolsList } from "@/data/tools";
import { getRelatedAudioToolIds } from "@/lib/audio-tool-page";

export { RelatedAudioToolsHub } from "@/components/tools/RelatedAudioToolsHub";

type RelatedAudioToolsProps = {
  toolId: string;
};

export async function RelatedAudioTools({ toolId }: RelatedAudioToolsProps) {
  const relatedIds = getRelatedAudioToolIds(toolId);
  const related = toolsList.filter((tool) => relatedIds.includes(tool.id));
  if (!related.length) return null;

  const tPage = await getTranslations("ToolPage");

  return (
    <ToolPageDashboardSection aria-labelledby="related-audio-tools-heading">
      <h2
        id="related-audio-tools-heading"
        className="mb-4 text-lg font-semibold tracking-wide text-ink dark:text-white"
      >
        {tPage("relatedTools")}
      </h2>
      <CompactToolCardGrid
        variant="flat"
        items={related.map((item) => ({
          href: `/tools/${item.id}/`,
          label: item.name,
          slugHint: item.id,
        }))}
      />
    </ToolPageDashboardSection>
  );
}
