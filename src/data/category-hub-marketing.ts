import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { INVENTORY_HUB_META } from "@/data/inventory-hubs";

export type CategoryHubMarketingCopy = {
  title: string;
  subtitle: string;
};

/**
 * Premium hero copy for category hubs — local-first positioning,
 * matching the homepage marketing tone.
 */
const CATEGORY_HUB_MARKETING: Partial<
  Record<InventoryCategoryId, CategoryHubMarketingCopy>
> = {
  pdf: {
    title: "Advanced PDF Utilities, Processed Locally",
    subtitle:
      "Merge, split, compress, sign, and organize documents in your browser — zero uploads, instant results, total privacy.",
  },
  image: {
    title: "Image Processing, Entirely On-Device",
    subtitle:
      "Convert, crop, watermark, and clean photos without shipping pixels to the cloud. Fast, private, and ad-free.",
  },
  convert: {
    title: "Format Conversion Without the Upload",
    subtitle:
      "Switch between documents, media, and data formats locally — no queues, no account wall, no remote copies.",
  },
  text: {
    title: "Text Tools That Stay On Your Machine",
    subtitle:
      "Format, transform, and prepare copy in the browser. Private by default, ready when you are.",
  },
  video: {
    title: "Video Utilities, Local-First Speed",
    subtitle:
      "Trim, convert, and compress footage in your browser — your files never leave this device.",
  },
  mp4: {
    title: "MP4 Tools Without Cloud Friction",
    subtitle:
      "Edit and convert MP4 files locally for instant exports and absolute privacy.",
  },
  compress: {
    title: "Compression That Keeps Files Private",
    subtitle:
      "Shrink PDFs, images, audio, and video on-device — quality-aware results with zero uploads.",
  },
  extract: {
    title: "Extract What You Need — Locally",
    subtitle:
      "Pull pages, tables, images, and colors from files without sending the source to a remote server.",
  },
  jpg: {
    title: "JPG Tools, Processed In-Browser",
    subtitle:
      "Optimize and convert JPGs instantly — private local processing from drop to download.",
  },
  png: {
    title: "PNG Utilities With Zero Uploads",
    subtitle:
      "Edit and convert PNG images locally for crisp graphics without cloud exposure.",
  },
  mp3: {
    title: "MP3 & Audio Tools, On Your Device",
    subtitle:
      "Trim, merge, and convert audio in the browser — no upload queue, no lingering server copies.",
  },
  audio: {
    title: "Audio Processing, Local-First",
    subtitle:
      "Handle everyday audio jobs privately in your browser with instant, on-device results.",
  },
  favicon: {
    title: "Favicon Packs, Built Locally",
    subtitle:
      "Generate icons for any site in your browser — fast exports without uploading your brand assets.",
  },
  json: {
    title: "JSON Tools for Private Data Work",
    subtitle:
      "Format, validate, and convert JSON locally so sensitive payloads never leave your machine.",
  },
  yaml: {
    title: "YAML Utilities, Client-Side Only",
    subtitle:
      "Edit and convert YAML configs in-browser with zero remote processing.",
  },
  xml: {
    title: "XML Tools Without the Cloud Trip",
    subtitle:
      "Format and convert XML locally — quick, private, and ready for production workflows.",
  },
  developer: {
    title: "Developer Utilities, Privacy-First",
    subtitle:
      "Hashes, tokens, encoding, and data tools that run in your browser — no account required.",
  },
  word: {
    title: "Word Document Tools, Processed Locally",
    subtitle:
      "Convert and work with Word docs in-browser without uploading confidential drafts.",
  },
  excel: {
    title: "Spreadsheet Tools That Stay Private",
    subtitle:
      "Convert and explore Excel files locally for fast results without cloud exposure.",
  },
  crop: {
    title: "Precision Cropping, On-Device",
    subtitle:
      "Crop PDFs and images locally — clean edges, instant exports, zero uploads.",
  },
  rotate: {
    title: "Rotate & Align Without Uploads",
    subtitle:
      "Fix page and image orientation in your browser with private local processing.",
  },
  security: {
    title: "Security Tools With Local Guarantees",
    subtitle:
      "Protect, unlock, redact, and scrub metadata — every step stays on your device.",
  },
  design: {
    title: "Design Utilities, Browser-Native",
    subtitle:
      "Color, SVG, and design helpers that run locally so creative assets never leave your tab.",
  },
  data: {
    title: "Data Conversion, Entirely Local",
    subtitle:
      "Convert and explore structured data in-browser — private by default, fast by design.",
  },
  productivity: {
    title: "Productivity Tools Without Friction",
    subtitle:
      "Everyday workflow utilities that open instantly and process everything on your device.",
  },
  "unit-math": {
    title: "Unit & Math Converters, Instant & Local",
    subtitle:
      "Convert units and run calculations in your browser — no signup, no remote round-trips.",
  },
  network: {
    title: "Network & API Inspectors, Client-Side",
    subtitle:
      "Inspect IP, SSL, and API details from your browser with a clean, private toolkit.",
  },
};

export function getCategoryHubMarketing(
  categoryId: InventoryCategoryId,
): CategoryHubMarketingCopy {
  const custom = CATEGORY_HUB_MARKETING[categoryId];
  if (custom) return custom;

  const meta = INVENTORY_HUB_META[categoryId];
  return {
    title: `${meta.title}, Processed Locally`,
    subtitle: `${meta.blurb}. Zero uploads — everything runs in your browser for speed and privacy.`,
  };
}
