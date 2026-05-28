import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { registry } from "@/lib/registry";
import { STUDIO_TOOLS } from "@/lib/studio-tools";
import { getToolDisplayLabel } from "@/lib/tool-labels";

export function ToolGrid() {
  const toolItems = [
    ...registry.tools.map((t) => ({
      href: `/tools/${t.slug}/`,
      label: getToolDisplayLabel(t.slug, t.title),
      slugHint: t.slug,
    })),
    ...STUDIO_TOOLS.map((tool) => ({
      href: tool.href,
      label: tool.ctaLabel,
      slugHint: tool.slug,
    })),
  ];

  return (
    <CompactToolCardGrid items={toolItems} />
  );
}
