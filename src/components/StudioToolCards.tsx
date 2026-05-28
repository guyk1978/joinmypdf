import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { STUDIO_TOOLS } from "@/lib/studio-tools";

export function StudioToolCards() {
  return (
    <CompactToolCardGrid
      items={STUDIO_TOOLS.map((tool) => ({
        href: tool.href,
        label: tool.ctaLabel,
        slugHint: tool.slug,
      }))}
    />
  );
}
