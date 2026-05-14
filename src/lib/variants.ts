import type { SiteRegistry, ToolDefinition, ToolVariant } from "./types";

const MODIFIER_LIBRARY = [
  "fast",
  "free",
  "online",
  "mobile",
  "no-upload",
  "high-quality",
  "large-files",
  "no-signup",
  "secure",
  "instant",
];

const COMBOS = [
  ["online", "fast"],
  ["free", "no-signup"],
  ["mobile", "fast"],
  ["high-quality", "online"],
  ["large-files", "fast"],
  ["secure", "no-upload"],
  ["instant", "online"],
  ["free", "mobile"],
  ["large-files", "high-quality"],
  ["no-upload", "mobile"],
];

export function generateClusterVariants(
  tool: ToolDefinition,
  registry: SiteRegistry
): ToolVariant[] {
  const defaults = registry.clusterDefaults || {};
  const modifiers = defaults.modifiers || MODIFIER_LIBRARY;
  const targetCount = Math.max(
    20,
    Math.min(100, Number(defaults.targetVariantCount || 24))
  );
  const baseKeyword = (tool.primaryKeyword || tool.slug.replaceAll("-", " "))
    .replace(/\s+/g, " ")
    .trim();
  const baseShort = baseKeyword.replace(/\bonline\b/gi, "").trim();

  const manual: ToolVariant[] = (tool.longTailPages || []).map((entry) => ({
    slug: entry.slug,
    keyword: entry.keyword || baseKeyword,
    modifier: (entry.modifier || entry.slug.replace(`${tool.slug}-`, "")).toLowerCase(),
    angle: entry.angle || "Workflow tuned to a common document scenario.",
    source: "manual",
  }));

  const generated: ToolVariant[] = [];
  modifiers.forEach((modifier) => {
    generated.push({
      slug: `${tool.slug}-${modifier}`,
      keyword: `${baseShort} ${modifier.replaceAll("-", " ")}`.trim(),
      modifier,
      angle: humanAngleForModifier(modifier),
      source: "single",
    });
  });
  COMBOS.forEach((pair) => {
    const key = pair.join("-");
    generated.push({
      slug: `${tool.slug}-${key}`,
      keyword: `${baseShort} ${pair.join(" ").replaceAll("-", " ")}`.trim(),
      modifier: key,
      angle: `${humanAngleForModifier(pair[0])} ${humanAngleForModifier(pair[1])}`,
      source: "combo",
    });
  });

  const unique = new Map<string, ToolVariant>();
  manual.concat(generated).forEach((item) => {
    if (!unique.has(item.slug)) unique.set(item.slug, item);
  });
  return Array.from(unique.values()).slice(0, targetCount);
}

function humanAngleForModifier(modifier: string): string {
  const map: Record<string, string> = {
    fast: "Built for quick turnaround when you need output in minutes.",
    free: "No payment step for standard in-browser processing.",
    online: "Runs in modern desktop and mobile browsers with no install.",
    mobile: "Touch-friendly layout for completing tasks on phones and tablets.",
    "no-upload": "Files stay on your device—nothing is sent to our servers for processing.",
    "high-quality": "Prioritizes readable output for presentations and client deliverables.",
    "large-files": "Practical guidance for bigger documents and higher page counts.",
    "no-signup": "Start immediately without creating an account.",
    secure: "Local processing helps reduce exposure for sensitive documents.",
    instant: "Short, linear flow from upload to download.",
  };
  return map[modifier] || "Focused guidance for a common PDF task.";
}

export function allToolSlugs(registry: SiteRegistry): string[] {
  const out = new Set<string>();
  for (const tool of registry.tools) {
    out.add(tool.slug);
    for (const v of generateClusterVariants(tool, registry)) {
      out.add(v.slug);
    }
  }
  return Array.from(out);
}

export function resolveToolRoute(
  slug: string,
  registry: SiteRegistry
): { tool: ToolDefinition; variant: ToolVariant | null } | null {
  const direct = registry.tools.find((t) => t.slug === slug);
  if (direct) return { tool: direct, variant: null };
  for (const tool of registry.tools) {
    const variants = generateClusterVariants(tool, registry);
    const variant = variants.find((v) => v.slug === slug);
    if (variant) return { tool, variant };
    if (slug.startsWith(`${tool.slug}-`)) {
      const modifier = slug.slice(tool.slug.length + 1);
      return {
        tool,
        variant: {
          slug,
          keyword: `${tool.primaryKeyword.replace(/\bonline\b/gi, "").trim()} ${modifier.replaceAll("-", " ")}`,
          modifier,
          angle: humanAngleForModifier(modifier.split("-")[0] || modifier),
          source: "routed",
        },
      };
    }
  }
  return null;
}
