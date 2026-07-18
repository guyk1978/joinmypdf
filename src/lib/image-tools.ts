import type { DirectoryWorkflowColumn } from "@/components/ToolsDirectoryDashboard";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { TOOL_DEFINITIONS } from "@/config/tools";
import { JPG_TOOLS_HUB_PATH } from "@/lib/jpg-tools";
import { PNG_TOOLS_HUB_PATH } from "@/lib/png-tools";
import { registry } from "@/lib/registry";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import type { ToolDefinition } from "@/lib/types";
import type { ToolGridItem } from "@/lib/tool-grid";

export const IMAGE_TOOL_CATEGORY = "image-tools" as const;
export const IMAGE_SUB_CATEGORIES = ["transform", "convert", "optimize"] as const;
export type ImageSubCategory = (typeof IMAGE_SUB_CATEGORIES)[number];

export type ImageToolIconKey =
  | "expand"
  | "file-image"
  | "crop"
  | "rotate-cw"
  | "minimize-2"
  | "image-down"
  | "eye-off"
  | "arrow-left-right"
  | "tags"
  | "pen-line"
  | "stamp"
  | "gauge"
  | "layers";

export type HomeImageToolItem = {
  id: string;
  href: string;
  label: string;
  description: string;
  iconKey: ImageToolIconKey;
  subCategory: ImageSubCategory;
};

export type HomeFeaturedImageItem = {
  id: string;
  href: string;
  label: string;
  iconKey: ImageToolIconKey;
};

/** Homepage — curated featured image tools */
export const HOMEPAGE_FEATURED_IMAGE_IDS = ["crop-image", "resize-image", "compress-image"] as const;

const SLUG_ICON_KEYS: Record<string, ImageToolIconKey> = {
  "resize-image": "expand",
  "convert-to-png": "file-image",
  "image-converter": "file-image",
  "crop-image": "crop",
  "rotate-image": "rotate-cw",
  "compress-image": "minimize-2",
  "heic-to-jpg": "image-down",
  "webp-to-jpg": "image-down",
  "svg-to-png": "file-image",
  "image-grayscale": "eye-off",
  "flip-image": "arrow-left-right",
  "image-metadata-editor": "tags",
  "image-metadata-wiper": "eye-off",
  "image-dpi-converter": "gauge",
  "image-optimizer": "minimize-2",
  "svg-optimizer": "minimize-2",
  "paint-on-image": "pen-line",
  "image-blur-redact": "eye-off",
  "image-watermark": "stamp",
  "image-grid-splitter": "crop",
  "image-combiner": "layers",
};

const DIRECTORY_ORDER: Record<ImageSubCategory, readonly string[]> = {
  transform: ["resize-image", "crop-image", "rotate-image", "flip-image", "paint-on-image", "image-blur-redact", "image-watermark", "image-grid-splitter", "image-combiner"],
  convert: [
    "image-converter",
    "convert-to-png",
    "heic-to-jpg",
    "webp-to-jpg",
    "svg-to-png",
    "image-grayscale",
    "image-metadata-editor",
    "image-metadata-wiper",
    "image-dpi-converter",
  ],
  optimize: ["compress-image", "image-optimizer", "svg-optimizer"],
};

const LABEL_KEY_BY_SLUG = new Map(TOOL_DEFINITIONS.map((tool) => [tool.slug, tool.labelKey]));

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

type CategoryDirectoryTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function isImageSubCategory(value: string): value is ImageSubCategory {
  return (IMAGE_SUB_CATEGORIES as readonly string[]).includes(value);
}

function getImageToolLabelKey(slug: string): string {
  return LABEL_KEY_BY_SLUG.get(slug) ?? slug.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

function resolveImageToolLabel(slug: string, title: string, tHome: HomeTranslator): string {
  const messageKey = `imageTools.items.${getImageToolLabelKey(slug)}.label`;
  return tHome.has(messageKey) ? tHome(messageKey) : title;
}

function resolveImageToolDescription(slug: string, description: string, tHome: HomeTranslator): string {
  const messageKey = `imageTools.items.${getImageToolLabelKey(slug)}.description`;
  return tHome.has(messageKey) ? tHome(messageKey) : description;
}

function resolveImageToolIconKey(slug: string): ImageToolIconKey {
  return SLUG_ICON_KEYS[slug] ?? "file-image";
}

function compareImageTools(a: ToolDefinition, b: ToolDefinition, subCategory: ImageSubCategory): number {
  const order = DIRECTORY_ORDER[subCategory];
  const aIndex = order.indexOf(a.slug);
  const bIndex = order.indexOf(b.slug);
  const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
  const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
  if (aRank !== bRank) return aRank - bRank;

  const aPriority = a.priority ?? 0;
  const bPriority = b.priority ?? 0;
  if (aPriority !== bPriority) return bPriority - aPriority;

  return a.slug.localeCompare(b.slug);
}

type RegistryImageTool = ToolDefinition & { subCategory: ImageSubCategory };

export function getRegistryImageTools(): RegistryImageTool[] {
  return registry.tools.filter((tool): tool is RegistryImageTool => {
    if (tool.category !== IMAGE_TOOL_CATEGORY) return false;
    return typeof tool.subCategory === "string" && isImageSubCategory(tool.subCategory);
  });
}

export function getImageToolSlugs(): string[] {
  return getRegistryImageTools().map((tool) => tool.slug);
}

export function buildHomeImageToolItems(
  tHome: HomeTranslator,
  locale?: string,
): HomeImageToolItem[] {
  return getRegistryImageTools()
    .slice()
    .sort((a, b) => {
      const subOrder =
        IMAGE_SUB_CATEGORIES.indexOf(a.subCategory) - IMAGE_SUB_CATEGORIES.indexOf(b.subCategory);
      if (subOrder !== 0) return subOrder;
      return compareImageTools(a, b, a.subCategory);
    })
    .map((tool) => ({
      id: tool.slug,
      href: resolveToolHref(tool.slug, "image", locale),
      label: resolveImageToolLabel(tool.slug, tool.title, tHome),
      description: resolveImageToolDescription(tool.slug, tool.description, tHome),
      iconKey: resolveImageToolIconKey(tool.slug),
      subCategory: tool.subCategory,
    }));
}

export function buildHomepageFeaturedImageItems(
  tHome: HomeTranslator,
  locale?: string,
): HomeFeaturedImageItem[] {
  const jpgHubLabel = tHome.has("jpgToolsHubLabel") ? tHome("jpgToolsHubLabel") : "JPG Tools";
  const pngHubLabel = tHome.has("pngToolsHubLabel") ? tHome("pngToolsHubLabel") : "PNG Tools";

  const hubItems: HomeFeaturedImageItem[] = [
    {
      id: "jpg-tools-hub",
      href: JPG_TOOLS_HUB_PATH,
      label: jpgHubLabel,
      iconKey: "file-image",
    },
    {
      id: "png-tools-hub",
      href: PNG_TOOLS_HUB_PATH,
      label: pngHubLabel,
      iconKey: "file-image",
    },
  ];

  const itemsById = new Map(buildHomeImageToolItems(tHome, locale).map((item) => [item.id, item]));

  const toolItems = HOMEPAGE_FEATURED_IMAGE_IDS.map((id) => itemsById.get(id))
    .filter((item): item is HomeImageToolItem => Boolean(item))
    .map((item) => ({
      id: item.id,
      href: item.href,
      label: item.label,
      iconKey: item.iconKey,
    }));

  return [...hubItems, ...toolItems];
}

function toGridItem(
  item: HomeImageToolItem,
  tTools?: { (key: string): string; has: (key: string) => boolean },
): ToolGridItem {
  return {
    href: item.href,
    label: item.label,
    slugHint: item.id,
    description: getToolCardDescription(item.id, undefined, tTools),
  };
}

function workflowTitle(t: CategoryDirectoryTranslator, workflowId: ImageSubCategory): string {
  return t(`workflows.image.${workflowId}.title`);
}

function workflowDescription(t: CategoryDirectoryTranslator, workflowId: ImageSubCategory): string | undefined {
  const key = `workflows.image.${workflowId}.description`;
  return t.has(key) ? t(key) : undefined;
}

export function buildImageCategoryDirectoryColumns(
  tHome: HomeTranslator,
  tCategory: CategoryDirectoryTranslator,
  locale?: string,
  tTools?: { (key: string): string; has: (key: string) => boolean },
): DirectoryWorkflowColumn[] {
  const items = buildHomeImageToolItems(tHome, locale);
  const itemsBySubCategory = new Map<ImageSubCategory, HomeImageToolItem[]>();

  for (const subCategory of IMAGE_SUB_CATEGORIES) {
    itemsBySubCategory.set(subCategory, []);
  }

  for (const item of items) {
    itemsBySubCategory.get(item.subCategory)?.push(item);
  }

  return IMAGE_SUB_CATEGORIES.map((workflowId) => ({
    id: workflowId,
    title: workflowTitle(tCategory, workflowId),
    description: workflowDescription(tCategory, workflowId),
    categories: [
      {
        id: `image-${workflowId}`,
        title: "",
        items: (itemsBySubCategory.get(workflowId) ?? []).map((item) => toGridItem(item, tTools)),
      },
    ],
  }));
}

/** @deprecated Use getImageToolSlugs() — kept for transitional imports. */
export const HOME_IMAGE_TOOL_IDS = getImageToolSlugs();
