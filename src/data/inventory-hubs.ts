/**
 * Inventory hub category IDs — used as multi-tags on each tool.
 * Hub pages filter with getInventoryToolsByCategory(id).
 */
export type InventoryCategoryId =
  | "pdf"
  | "video"
  | "mp4"
  | "convert"
  | "compress"
  | "extract"
  | "image"
  | "jpg"
  | "png"
  | "mp3"
  | "audio"
  | "favicon"
  | "text"
  | "json"
  | "yaml"
  | "xml"
  | "developer"
  | "word"
  | "excel"
  | "crop"
  | "rotate"
  | "security"
  | "design"
  | "data"
  | "productivity";

export type PdfInventorySectionId =
  | "mergeSplit"
  | "conversion"
  | "compression"
  | "securityUtilities";

export type ToolsInventoryEntry = {
  id: string;
  title: string;
  path: string;
  description: string;
  /** All hubs / taxonomies this tool belongs to. */
  categories: readonly InventoryCategoryId[];
  /** Primary listing used by All Tools modal grouping. */
  primaryCategory: InventoryCategoryId;
  /** Optional PDF hub subsection. */
  pdfSection?: PdfInventorySectionId;
  /** Optional i18n label key under Header.navItems / hub tools.*. */
  labelKey?: string;
};

export const INVENTORY_HUB_META: Record<
  InventoryCategoryId,
  { path: string; title: string }
> = {
  pdf: { path: "/tools/pdf-tools/", title: "PDF Tools" },
  video: { path: "/tools/video-tools/", title: "Video Tools" },
  mp4: { path: "/tools/mp4-tools/", title: "MP4 Tools" },
  convert: { path: "/tools/convert-tools/", title: "Convert Tools" },
  compress: { path: "/tools/compress-tools/", title: "Compress Tools" },
  extract: { path: "/tools/extract-tools/", title: "Extract Tools" },
  image: { path: "/image-tools/", title: "Image Tools" },
  jpg: { path: "/tools/jpg-tools/", title: "JPG Tools" },
  png: { path: "/tools/png-tools/", title: "PNG Tools" },
  mp3: { path: "/tools/mp3-tools/", title: "MP3 Tools" },
  audio: { path: "/tools/mp3-tools/", title: "Audio Tools" },
  favicon: { path: "/tools/favicon-tools/", title: "Favicon Tools" },
  text: { path: "/tools/text-tools/", title: "Text Tools" },
  json: { path: "/tools/json-tools/", title: "JSON Tools" },
  yaml: { path: "/tools/yaml-tools/", title: "YAML Tools" },
  xml: { path: "/tools/xml-tools/", title: "XML Tools" },
  developer: { path: "/tools/developer-tools/", title: "Developer Tools" },
  word: { path: "/tools/word-tools/", title: "Word Tools" },
  excel: { path: "/tools/excel-tools/", title: "Excel Tools" },
  crop: { path: "/tools/crop-tools/", title: "Crop Tools" },
  rotate: { path: "/tools/rotate-tools/", title: "Rotate Tools" },
  security: { path: "/security-tools/", title: "Security Tools" },
  design: { path: "/tools/", title: "Design Tools" },
  data: { path: "/data-conversion-tools/", title: "Data Conversion" },
  productivity: { path: "/productivity-tools/", title: "Productivity Tools" },
};
