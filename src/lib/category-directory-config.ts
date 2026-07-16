import type { DirectoryWorkflowColumn } from "@/components/ToolsDirectoryDashboard";
import { buildHomeAudioToolItems } from "@/lib/audio-tools";
import { buildHomeDataConversionToolItems } from "@/lib/data-conversion-tools";
import { buildHomeDeveloperToolItems } from "@/lib/developer-tools";
import { buildHomeFaviconToolItems } from "@/lib/favicon-tools";
import {
  buildHomeImageToolItems,
  buildImageCategoryDirectoryColumns,
} from "@/lib/image-tools";
import { buildHomeProductivityToolItems } from "@/lib/productivity-tools";
import { buildHomeSecurityToolItems } from "@/lib/security-tools";
import { buildHomeTextJsonToolItems } from "@/lib/text-json-tools";
import type { ToolGridItem } from "@/lib/tool-grid";

export type CategoryDirectoryId =
  | "security"
  | "image"
  | "audio"
  | "developer"
  | "data-conversion"
  | "productivity"
  | "favicon"
  | "text-json"
  | "utilities";

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

type CategoryDirectoryTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

type WorkflowSpec = {
  id: string;
  toolIds?: readonly string[];
  categoryTitleKey?: string;
};

type CategorySpec = {
  id: CategoryDirectoryId;
  workflows: WorkflowSpec[];
  buildItems: (tHome: HomeTranslator) => { id: string; href: string; label: string }[];
  featuredIds?: readonly string[];
  layout?: "default" | "flat-grid";
};

const CATEGORY_SPECS: Record<CategoryDirectoryId, CategorySpec> = {
  security: {
    id: "security",
    featuredIds: ["password-generator", "hash-generator", "uuid-generator", "ssl-decoder"],
    buildItems: buildHomeSecurityToolItems,
    workflows: [
      { id: "passwords", toolIds: ["password-generator"] },
      { id: "hashing", toolIds: ["hash-generator"] },
      { id: "identifiers", toolIds: ["uuid-generator"] },
      { id: "certificates", toolIds: ["ssl-decoder"] },
    ],
  },
  image: {
    id: "image",
    featuredIds: ["crop-image", "resize-image", "compress-image"],
    buildItems: buildHomeImageToolItems,
    workflows: [{ id: "transform" }, { id: "convert" }, { id: "optimize" }],
  },
  audio: {
    id: "audio",
    featuredIds: ["mp3-converter", "audio-trimmer", "mp3-trimmer", "audio-compressor"],
    buildItems: () => buildHomeAudioToolItems(),
    workflows: [
      {
        id: "convert",
        toolIds: [
          "mp3-converter",
          "wav-to-mp3",
          "mp3-to-wav",
          "ogg-converter",
          "flac-converter",
          "m4a-converter",
          "mp4-to-mp3",
        ],
      },
      {
        id: "edit",
        toolIds: [
          "audio-compressor",
          "mp3-compressor",
          "audio-trimmer",
          "mp3-trimmer",
          "mp3-volume-booster",
          "mp3-speed-changer",
          "fade-in-out-creator",
          "audio-normalizer",
          "silence-remover",
          "voice-remover",
        ],
      },
      {
        id: "mix-metadata",
        toolIds: ["audio-merger", "mp3-metadata-editor", "mp3-to-mp4"],
      },
    ],
  },
  developer: {
    id: "developer",
    featuredIds: ["user-agent-parser", "jwt-debugger", "qr-code-generator"],
    buildItems: buildHomeDeveloperToolItems,
    workflows: [
      { id: "parse", toolIds: ["user-agent-parser"] },
      { id: "generate", toolIds: ["qr-code-generator"] },
      { id: "debug", toolIds: ["jwt-debugger"] },
    ],
  },
  "data-conversion": {
    id: "data-conversion",
    featuredIds: ["yaml-json-converter", "csv-to-markdown-table", "sql-query-formatter"],
    buildItems: buildHomeDataConversionToolItems,
    workflows: [
      { id: "interchange", toolIds: ["yaml-json-converter"] },
      { id: "tables", toolIds: ["csv-to-markdown-table"] },
      { id: "sql", toolIds: ["sql-query-formatter"] },
    ],
  },
  productivity: {
    id: "productivity",
    layout: "flat-grid",
    buildItems: buildHomeProductivityToolItems,
    workflows: [],
  },
  favicon: {
    id: "favicon",
    featuredIds: ["generate-favicon", "png-to-ico", "ico-to-png"],
    buildItems: buildHomeFaviconToolItems,
    workflows: [
      {
        id: "create",
        toolIds: ["generate-favicon", "png-to-ico", "ico-to-png", "svg-to-favicon"],
      },
      {
        id: "edit",
        toolIds: [
          "favicon-cropper",
          "favicon-compressor",
          "transparent-favicon",
          "apple-touch-icon",
        ],
      },
      {
        id: "publish",
        toolIds: ["favicon-pack", "favicon-code-generator", "favicon-previewer"],
      },
    ],
  },
  "text-json": {
    id: "text-json",
    featuredIds: ["json-formatter", "json-to-csv", "base64-encoder-decoder"],
    buildItems: buildHomeTextJsonToolItems,
    workflows: [
      {
        id: "json",
        toolIds: ["json-formatter", "json-csv-explorer", "json-minifier", "json-to-csv", "csv-to-json"],
      },
      {
        id: "encode",
        toolIds: ["base64-encoder-decoder", "url-encoder-decoder", "url-parameter-stripper"],
      },
      {
        id: "text",
        toolIds: [
          "text-diff-checker",
          "text-diff",
          "text-sanitizer",
          "string-generator",
          "html-markdown-converter",
          "word-character-counter",
          "quick-note",
          "readability-analyzer",
        ],
      },
    ],
  },
  utilities: {
    id: "utilities",
    buildItems: (tHome) => [
      ...buildHomeFaviconToolItems(tHome),
      ...buildHomeTextJsonToolItems(tHome),
    ],
    workflows: [
      {
        id: "favicon-create",
        categoryTitleKey: "faviconCreate",
        toolIds: ["generate-favicon", "png-to-ico", "ico-to-png", "svg-to-favicon"],
      },
      {
        id: "favicon-edit",
        categoryTitleKey: "faviconEdit",
        toolIds: [
          "favicon-cropper",
          "favicon-compressor",
          "transparent-favicon",
          "apple-touch-icon",
          "favicon-pack",
          "favicon-code-generator",
          "favicon-previewer",
        ],
      },
      {
        id: "text-json",
        categoryTitleKey: "textJson",
        toolIds: [
          "json-formatter",
          "json-csv-explorer",
          "json-minifier",
          "json-to-csv",
          "csv-to-json",
          "base64-encoder-decoder",
          "url-encoder-decoder",
          "url-parameter-stripper",
          "text-diff-checker",
          "text-diff",
          "text-sanitizer",
          "string-generator",
          "html-markdown-converter",
          "word-character-counter",
          "readability-analyzer",
        ],
      },
    ],
  },
};

function toGridItem(item: { id: string; href: string; label: string }): ToolGridItem {
  return {
    href: item.href,
    label: item.label,
    slugHint: item.id,
  };
}

function workflowTitle(t: CategoryDirectoryTranslator, categoryId: CategoryDirectoryId, workflowId: string) {
  return t(`workflows.${categoryId}.${workflowId}.title`);
}

function workflowDescription(
  t: CategoryDirectoryTranslator,
  categoryId: CategoryDirectoryId,
  workflowId: string,
) {
  const key = `workflows.${categoryId}.${workflowId}.description`;
  return t.has(key) ? t(key) : undefined;
}

export function buildCategoryDirectoryColumns(
  categoryId: CategoryDirectoryId,
  tHome: HomeTranslator,
  tCategory: CategoryDirectoryTranslator,
): DirectoryWorkflowColumn[] {
  if (categoryId === "image") {
    return buildImageCategoryDirectoryColumns(tHome, tCategory);
  }

  const spec = CATEGORY_SPECS[categoryId];
  const items = spec.buildItems(tHome);
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return spec.workflows.map((workflow) => {
    const workflowItems = (workflow.toolIds ?? [])
      .map((id) => itemsById.get(id))
      .filter((item): item is (typeof items)[number] => Boolean(item))
      .map(toGridItem);

    return {
      id: workflow.id,
      title: workflowTitle(tCategory, categoryId, workflow.id),
      description: workflowDescription(tCategory, categoryId, workflow.id),
      categories: [
        {
          id: `${categoryId}-${workflow.id}`,
          title: "",
          items: workflowItems,
        },
      ],
    };
  });
}

export function buildCategoryDirectoryFeaturedItems(
  categoryId: CategoryDirectoryId,
  tHome: HomeTranslator,
): ToolGridItem[] {
  const spec = CATEGORY_SPECS[categoryId];
  if (!spec.featuredIds?.length) return [];

  const items = spec.buildItems(tHome);
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return spec.featuredIds
    .map((id) => itemsById.get(id))
    .filter((item): item is (typeof items)[number] => Boolean(item))
    .map(toGridItem);
}

export function getCategoryDirectoryItemCount(categoryId: CategoryDirectoryId, tHome: HomeTranslator): number {
  return CATEGORY_SPECS[categoryId].buildItems(tHome).length;
}

const DIRECTORY_META: Record<
  CategoryDirectoryId,
  { titleKey: string; descriptionKey: string }
> = {
  security: {
    titleKey: "securityToolsDirectoryTitle",
    descriptionKey: "securityToolsDirectoryDescription",
  },
  image: {
    titleKey: "imageToolsDirectoryTitle",
    descriptionKey: "imageToolsDirectoryDescription",
  },
  audio: {
    titleKey: "audioToolsDirectoryTitle",
    descriptionKey: "audioToolsDirectoryDescription",
  },
  developer: {
    titleKey: "developerToolsDirectoryTitle",
    descriptionKey: "developerToolsDirectoryDescription",
  },
  "data-conversion": {
    titleKey: "dataConversionToolsDirectoryTitle",
    descriptionKey: "dataConversionToolsDirectoryDescription",
  },
  productivity: {
    titleKey: "productivityToolsDirectoryTitle",
    descriptionKey: "productivityToolsDirectoryDescription",
  },
  favicon: {
    titleKey: "faviconToolsDirectoryTitle",
    descriptionKey: "faviconToolsDirectoryDescription",
  },
  "text-json": {
    titleKey: "textJsonToolsDirectoryTitle",
    descriptionKey: "textJsonToolsDirectoryDescription",
  },
  utilities: {
    titleKey: "utilitiesDirectoryTitle",
    descriptionKey: "utilitiesDirectoryDescription",
  },
};

export function getCategoryDirectoryPageProps(
  categoryId: CategoryDirectoryId,
  tHome: HomeTranslator,
  tCategory: CategoryDirectoryTranslator,
) {
  const meta = DIRECTORY_META[categoryId];
  const spec = CATEGORY_SPECS[categoryId];
  const usesFlatGrid = spec.layout === "flat-grid";
  const featuredItems = usesFlatGrid ? [] : buildCategoryDirectoryFeaturedItems(categoryId, tHome);
  const startHereKey = `startHereDescription.${categoryId}`;
  const flatGridItems = usesFlatGrid
    ? spec.buildItems(tHome).map((item) => toGridItem(item))
    : undefined;

  return {
    title: tHome(meta.titleKey),
    description: tHome(meta.descriptionKey),
    eyebrow: tCategory("badge"),
    featuredItems,
    featuredTitle: featuredItems.length > 0 ? tCategory("startHere") : undefined,
    featuredDescription:
      featuredItems.length > 0 && tCategory.has(startHereKey) ? tCategory(startHereKey) : undefined,
    workflowColumns: usesFlatGrid ? [] : buildCategoryDirectoryColumns(categoryId, tHome, tCategory),
    flatGridItems,
  };
}
