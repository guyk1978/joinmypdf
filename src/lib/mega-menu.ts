import { registry } from "@/lib/registry";
import { STUDIO_TOOLS } from "@/lib/studio-tools";
import { getToolDisplayLabel } from "@/lib/tool-labels";

export type MegaMenuItem = {
  href: string;
  label: string;
  slug: string;
};

export type MegaMenuSection = {
  id: string;
  label: string;
  items: MegaMenuItem[];
};

const SECTION_META: { id: string; label: string; categories: string[] }[] = [
  { id: "convert", label: "Convert PDF", categories: ["convert"] },
  { id: "edit", label: "Edit & Organize", categories: ["edit"] },
  { id: "optimize", label: "Optimize", categories: ["optimize"] },
  { id: "security", label: "Security & Privacy", categories: ["security"] },
];

export function buildMegaMenuSections(): MegaMenuSection[] {
  const sections: MegaMenuSection[] = SECTION_META.map((meta) => ({
    id: meta.id,
    label: meta.label,
    items: registry.tools
      .filter((tool) => meta.categories.includes(tool.category))
      .map((tool) => ({
        href: `/tools/${tool.slug}/`,
        label: getToolDisplayLabel(tool.slug, tool.title),
        slug: tool.slug,
      })),
  }));

  const edit = sections.find((s) => s.id === "edit");
  if (edit) {
    for (const studio of STUDIO_TOOLS) {
      edit.items.push({
        href: studio.href,
        label: getToolDisplayLabel(studio.slug, studio.ctaLabel),
        slug: studio.slug,
      });
    }
  }

  const optimize = sections.find((s) => s.id === "optimize");
  if (optimize) {
    optimize.items.push({
      href: "/compare/",
      label: "Compare tools",
      slug: "compare",
    });
  }

  return sections;
}

/** Flat list of every tool link from mega-menu sections (deduped by href). */
export function flattenMegaMenuSections(sections: MegaMenuSection[]): MegaMenuItem[] {
  const seen = new Set<string>();
  const items: MegaMenuItem[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      items.push(item);
    }
  }
  return items;
}

export type ToolMegaGridGroupId = "conversion" | "editing" | "security" | "advanced";

export type ToolMegaGridGroup = {
  id: ToolMegaGridGroupId;
  items: MegaMenuItem[];
};

const MEGA_GRID_GROUP_ORDER: ToolMegaGridGroupId[] = ["conversion", "editing", "security", "advanced"];

function toolToMegaItem(tool: (typeof registry.tools)[number]): MegaMenuItem {
  return {
    href: `/tools/${tool.slug}/`,
    label: getToolDisplayLabel(tool.slug, tool.title),
    slug: tool.slug,
  };
}

/** Category groups for the full-width All Tools mega grid. */
export function buildToolMegaGridGroups(): ToolMegaGridGroup[] {
  const conversion = registry.tools.filter((tool) => tool.category === "convert").map(toolToMegaItem);
  const editing = registry.tools.filter((tool) => tool.category === "edit").map(toolToMegaItem);
  const security = registry.tools.filter((tool) => tool.category === "security").map(toolToMegaItem);
  const advanced: MegaMenuItem[] = [
    ...registry.tools.filter((tool) => tool.category === "optimize").map(toolToMegaItem),
    ...STUDIO_TOOLS.map((studio) => ({
      href: studio.href,
      label: getToolDisplayLabel(studio.slug, studio.ctaLabel),
      slug: studio.slug,
    })),
    {
      href: "/compare/",
      label: "Compare tools",
      slug: "compare",
    },
  ];

  const byId: Record<ToolMegaGridGroupId, MegaMenuItem[]> = {
    conversion,
    editing,
    security,
    advanced,
  };

  return MEGA_GRID_GROUP_ORDER.map((id) => ({ id, items: byId[id] })).filter((group) => group.items.length > 0);
}
