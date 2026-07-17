import {
  INVENTORY_HUB_META,
  type InventoryCategoryId,
} from "@/data/inventory-hubs";
import { getToolsInventoryEntry } from "@/data/tools-inventory";

function normalizePath(path: string): string {
  const bare = path.split("?")[0]?.split("#")[0] ?? path;
  let pathname = bare.startsWith("/") ? bare : `/${bare}`;
  pathname = pathname.replace(/^\/(en|he)(?=\/)/, "");
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (pathname.length > 1 && !pathname.endsWith("/")) pathname = `${pathname}/`;
  return pathname;
}

/** Hub folder segment, e.g. `video-tools` from `/tools/video-tools/`. */
export function getCategoryHubSegment(categoryId: InventoryCategoryId): string {
  const path = normalizeHubPath(categoryId);
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "tools";
}

/**
 * Canonical category hub path — always under `/tools/` (except bare `/tools/` catch-all).
 */
export function normalizeHubPath(categoryId: InventoryCategoryId): string {
  const raw = INVENTORY_HUB_META[categoryId]?.path ?? "/tools/";
  let path = raw.startsWith("/") ? raw : `/${raw}`;
  if (!path.endsWith("/")) path = `${path}/`;

  // Migrate legacy top-level hubs under /tools/
  if (
    path === "/image-tools/" ||
    path === "/security-tools/" ||
    path === "/productivity-tools/" ||
    path === "/data-conversion-tools/"
  ) {
    path = `/tools${path}`;
  }

  if (path === "/tools/") return path;
  if (!path.startsWith("/tools/")) {
    path = `/tools/${path.replace(/^\//, "")}`;
  }
  return path;
}

/** Nested tool URL: `/tools/{hub-segment}/{slug}/`. */
export function buildNestedToolPath(
  slug: string,
  categoryId: InventoryCategoryId,
): string {
  const hub = normalizeHubPath(categoryId).replace(/\/$/, "");
  if (hub === "/tools") {
    return normalizePath(`/tools/${slug}/`);
  }
  return normalizePath(`${hub}/${slug}/`);
}

/**
 * Resolve the public tool href from inventory + optional parent category context.
 * Parent category wins so Video hub links use the Video nest even for multi-tagged tools.
 */
export function resolveToolHref(
  slug: string,
  parentCategoryId?: InventoryCategoryId,
): string {
  const entry = getToolsInventoryEntry(slug);
  const category =
    parentCategoryId ?? entry?.primaryCategory ?? ("pdf" as InventoryCategoryId);
  return buildNestedToolPath(slug, category);
}

/** Parse `/tools/{hub}/{slug}/` (locale-stripped) into hierarchy parts. */
export function parseToolHierarchyPath(pathname: string): {
  hubSegment?: string;
  slug?: string;
  categoryId?: InventoryCategoryId;
} | null {
  const normalized = normalizePath(pathname).replace(/\/$/, "");
  const parts = normalized.split("/").filter(Boolean);
  // tools / hub / slug
  if (parts.length >= 3 && parts[0] === "tools") {
    const hubSegment = parts[1];
    const slug = parts[parts.length - 1];
    if (isCategoryHubSegment(hubSegment) && slug && slug !== hubSegment) {
      return {
        hubSegment,
        slug,
        categoryId: categoryIdFromHubSegment(hubSegment),
      };
    }
  }
  // flat tools / slug
  if (parts.length === 2 && parts[0] === "tools") {
    const slug = parts[1];
    if (!isCategoryHubSegment(slug)) {
      const entry = getToolsInventoryEntry(slug);
      return {
        slug,
        categoryId: entry?.primaryCategory,
        hubSegment: entry
          ? getCategoryHubSegment(entry.primaryCategory)
          : undefined,
      };
    }
  }
  return null;
}

const HUB_SEGMENT_TO_CATEGORY = new Map<string, InventoryCategoryId>();

function rebuildHubSegmentMap() {
  HUB_SEGMENT_TO_CATEGORY.clear();
  for (const id of Object.keys(INVENTORY_HUB_META) as InventoryCategoryId[]) {
    const segment = getCategoryHubSegment(id);
    if (segment && segment !== "tools") {
      HUB_SEGMENT_TO_CATEGORY.set(segment, id);
    }
  }
  // Aliases for legacy / migrated segments
  HUB_SEGMENT_TO_CATEGORY.set("image-tools", "image");
  HUB_SEGMENT_TO_CATEGORY.set("security-tools", "security");
  HUB_SEGMENT_TO_CATEGORY.set("productivity-tools", "productivity");
  HUB_SEGMENT_TO_CATEGORY.set("data-conversion-tools", "data");
  HUB_SEGMENT_TO_CATEGORY.set("unit-converters", "unit-math");
}

rebuildHubSegmentMap();

export function isCategoryHubSegment(segment: string): boolean {
  if (HUB_SEGMENT_TO_CATEGORY.size === 0) rebuildHubSegmentMap();
  return HUB_SEGMENT_TO_CATEGORY.has(segment);
}

export function categoryIdFromHubSegment(
  segment: string,
): InventoryCategoryId | undefined {
  if (HUB_SEGMENT_TO_CATEGORY.size === 0) rebuildHubSegmentMap();
  return HUB_SEGMENT_TO_CATEGORY.get(segment);
}

/** Map any hub path (legacy or nested) to a category id. */
export function categoryIdFromHubPath(
  hubPath: string,
): InventoryCategoryId | undefined {
  const normalized = normalizePath(hubPath);
  for (const id of Object.keys(INVENTORY_HUB_META) as InventoryCategoryId[]) {
    if (normalizeHubPath(id) === normalized) return id;
  }
  const segment = normalized.split("/").filter(Boolean).pop();
  return segment ? categoryIdFromHubSegment(segment) : undefined;
}
