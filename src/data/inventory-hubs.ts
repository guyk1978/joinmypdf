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
  | "productivity"
  | "unit-math"
  | "network";

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
  { path: string; title: string; blurb: string }
> = {
  pdf: {
    path: "/tools/pdf-tools/",
    title: "PDF Tools",
    blurb: "Merge, split, and organize pages",
  },
  video: {
    path: "/tools/video-tools/",
    title: "Video Tools",
    blurb: "Trim, convert, and compress video",
  },
  mp4: {
    path: "/tools/mp4-tools/",
    title: "MP4 Tools",
    blurb: "Edit and convert MP4 files",
  },
  convert: {
    path: "/tools/convert-tools/",
    title: "Convert Tools",
    blurb: "Switch formats without uploads",
  },
  compress: {
    path: "/tools/compress-tools/",
    title: "Compress Tools",
    blurb: "Shrink files while keeping quality",
  },
  extract: {
    path: "/tools/extract-tools/",
    title: "Extract Tools",
    blurb: "Pull pages, tables, images, and colors",
  },
  image: {
    path: "/tools/image-tools/",
    title: "Image Tools",
    blurb: "Resize, crop, and convert images",
  },
  jpg: {
    path: "/tools/jpg-tools/",
    title: "JPG Tools",
    blurb: "Optimize and convert JPG images",
  },
  png: {
    path: "/tools/png-tools/",
    title: "PNG Tools",
    blurb: "Edit and convert PNG images",
  },
  mp3: {
    path: "/tools/mp3-tools/",
    title: "MP3 Tools",
    blurb: "Trim, merge, and convert audio",
  },
  audio: {
    path: "/tools/mp3-tools/",
    title: "Audio Tools",
    blurb: "Process audio locally in-browser",
  },
  favicon: {
    path: "/tools/favicon-tools/",
    title: "Favicon Tools",
    blurb: "Generate icons for any site",
  },
  text: {
    path: "/tools/text-tools/",
    title: "Text Tools",
    blurb: "Clean, format, and transform text",
  },
  json: {
    path: "/tools/json-tools/",
    title: "JSON Tools",
    blurb: "Format, validate, and convert JSON",
  },
  yaml: {
    path: "/tools/yaml-tools/",
    title: "YAML Tools",
    blurb: "Edit and convert YAML configs",
  },
  xml: {
    path: "/tools/xml-tools/",
    title: "XML Tools",
    blurb: "Format and convert XML data",
  },
  developer: {
    path: "/tools/developer-tools/",
    title: "Developer Tools",
    blurb: "Hashes, tokens, and encoding tools",
  },
  word: {
    path: "/tools/word-tools/",
    title: "Word Tools",
    blurb: "Convert and work with Word docs",
  },
  excel: {
    path: "/tools/excel-tools/",
    title: "Excel Tools",
    blurb: "Convert and explore spreadsheets",
  },
  crop: {
    path: "/tools/crop-tools/",
    title: "Crop Tools",
    blurb: "Crop PDFs and images precisely",
  },
  rotate: {
    path: "/tools/rotate-tools/",
    title: "Rotate Tools",
    blurb: "Rotate pages and images",
  },
  security: {
    path: "/tools/security-tools/",
    title: "Security Tools",
    blurb: "Protect, unlock, and redact files",
  },
  design: {
    path: "/tools/developer-tools/",
    title: "Design Tools",
    blurb: "Color, SVG, and design utilities",
  },
  data: {
    path: "/tools/data-conversion-tools/",
    title: "Data Conversion",
    blurb: "Convert and explore structured data",
  },
  productivity: {
    path: "/tools/productivity-tools/",
    title: "Productivity Tools",
    blurb: "Everyday workflow utilities",
  },
  "unit-math": {
    path: "/tools/unit-converters/",
    title: "Unit Converters",
    blurb: "Convert units and run calculations",
  },
  network: {
    path: "/tools/network-tools/",
    title: "Network & API Tools",
    blurb: "Inspect IP, SSL, and API details",
  },
};
