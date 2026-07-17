/**
 * Factory helpers for nested hub tool routes:
 * `/tools/{hub-segment}/[slug]/`
 *
 * Important: with `output: "export"`, `generateStaticParams` must return at least
 * one path. Do not mount a `[slug]` route for hubs with zero inventory tools.
 *
 * Dedicated App Router pages (`tools/{slug}/page.tsx`) that are NOT in the
 * registry are excluded here — they are nested via
 * `scripts/generate-hub-dedicated-tool-pages.cjs`. Registry-backed tools
 * (including those with a dedicated page) stay in `[slug]` params so the
 * catch-all can render their workspace component.
 */
import { existsSync } from "fs";
import path from "path";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getInventoryToolsByCategory } from "@/lib/tools-inventory-query";
import { getCategoryHubSegment } from "@/lib/tool-hierarchy";
import { registry } from "@/lib/registry";

function hasDedicatedToolPage(slug: string): boolean {
  const cwd = typeof process.cwd === "function" ? process.cwd() : "";
  if (!cwd) return false;
  return existsSync(path.join(cwd, "src", "app", "[locale]", "tools", slug, "page.tsx"));
}

function isRegistryTool(slug: string): boolean {
  return registry.tools.some((tool) => tool.slug === slug);
}

export function listHubToolStaticParams(categoryId: InventoryCategoryId): { slug: string }[] {
  return getInventoryToolsByCategory(categoryId)
    .filter((tool) => {
      if (!hasDedicatedToolPage(tool.id)) return true;
      // Dedicated + registered → catch-all can render the workspace.
      return isRegistryTool(tool.id);
    })
    .map((tool) => ({
      slug: tool.id,
    }));
}

/** @deprecated Prefer listHubToolStaticParams inside an explicit generateStaticParams. */
export function createHubToolStaticParams(categoryId: InventoryCategoryId) {
  return function generateStaticParams() {
    const params = listHubToolStaticParams(categoryId);
    if (params.length === 0) {
      throw new Error(
        `Hub "${categoryId}" has no inventory tools — remove its [slug] route for static export.`,
      );
    }
    return params;
  };
}

export function hubSegmentForCategory(categoryId: InventoryCategoryId): string {
  return getCategoryHubSegment(categoryId);
}
