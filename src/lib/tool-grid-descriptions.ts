import { translateToolIntent } from "@/lib/i18n-tool-labels";
import { registry } from "@/lib/registry";
import { STUDIO_TOOLS } from "@/lib/studio-tools";

type ToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function resolveToolGridDescription(
  tTools: ToolsTranslator,
  slug: string,
  fallback = "",
): string {
  const tool = registry.tools.find((item) => item.slug === slug);
  if (tool) {
    return translateToolIntent(tTools, slug, tool.intent || tool.description);
  }

  const studio = STUDIO_TOOLS.find((item) => item.slug === slug);
  if (studio) {
    return translateToolIntent(tTools, slug, studio.subtitle);
  }

  if (slug === "compare") {
    return translateToolIntent(
      tTools,
      slug,
      "Compare PDF tools side by side to find the right workflow.",
    );
  }

  return fallback;
}
