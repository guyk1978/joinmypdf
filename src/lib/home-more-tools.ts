import { CONVERT_TOOLS_HUB_PATH } from "@/lib/convert-tools";
import { DEVELOPER_TOOLS_HUB_PATH } from "@/lib/developer-tools-hub";
import { EXTRACT_TOOLS_HUB_PATH } from "@/lib/extract-tools";
import { FAVICON_TOOLS_HUB_PATH } from "@/lib/favicon-tools";
import { resolveHomeToolCopy } from "@/lib/home-tool-copy";
import { JPG_TOOLS_HUB_PATH } from "@/lib/jpg-tools";
import { JSON_TOOLS_HUB_PATH } from "@/lib/json-tools";
import { MP3_TOOLS_HUB_PATH } from "@/lib/mp3-tools";
import { MP4_TOOLS_HUB_PATH } from "@/lib/mp4-tools";
import { PDF_TOOLS_HUB_PATH } from "@/lib/pdf-tools-hub";
import { PNG_TOOLS_HUB_PATH } from "@/lib/png-tools";
import { TEXT_TOOLS_HUB_PATH } from "@/lib/text-tools";
import { VIDEO_TOOLS_HUB_PATH } from "@/lib/video-tools-hub";
import { YAML_TOOLS_HUB_PATH } from "@/lib/yaml-tools";

export type HomeMoreToolsHubId = "media" | "image-design" | "developer-security" | "document-text";

export type HomeMoreToolsTitleKey =
  | "mediaSectionTitle"
  | "imageDesignSectionTitle"
  | "developerSecuritySectionTitle"
  | "documentTextSectionTitle";

export type HomeMoreToolsViewAllKey =
  | "viewAllMediaTools"
  | "viewAllImageDesignTools"
  | "viewAllDeveloperSecurityTools"
  | "viewAllDocumentTextTools";

export type HomeMoreToolsItem = {
  id: string;
  href: string;
  label: string;
};

export type HomeMoreToolsCategory = {
  id: HomeMoreToolsHubId;
  titleKey: HomeMoreToolsTitleKey;
  viewAllLabelKey: HomeMoreToolsViewAllKey;
  hubHref: string;
  items: HomeMoreToolsItem[];
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function hubLabel(tHome: HomeTranslator, key: string, fallback: string): string {
  return tHome.has(key) ? tHome(key) : fallback;
}

function toolLabel(tHome: HomeTranslator, ns: string, messageKey: string, id: string): string {
  return resolveHomeToolCopy(tHome, ns, messageKey, "label", id);
}

function imageToolLabel(tHome: HomeTranslator, messageKey: string, fallback: string): string {
  const key = `imageTools.items.${messageKey}.label`;
  return tHome.has(key) ? tHome(key) : fallback;
}

/** Curated hub-first directory for the homepage “More Professional Tools” section. */
export function buildHomeMoreToolsCategories(tHome: HomeTranslator): HomeMoreToolsCategory[] {
  return [
    {
      id: "media",
      titleKey: "mediaSectionTitle",
      viewAllLabelKey: "viewAllMediaTools",
      hubHref: VIDEO_TOOLS_HUB_PATH,
      items: [
        {
          id: "audio-merger",
          href: "/tools/mp3-tools/audio-merger/",
          label: hubLabel(tHome, "mergeMp3Label", "Merge MP3"),
        },
        {
          id: "mp4-tools-hub",
          href: MP4_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "mp4ToolsHubLabel", "MP4 Tools"),
        },
        {
          id: "video-tools-hub",
          href: VIDEO_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "videoToolsHubLabel", "Video Tools"),
        },
        {
          id: "mp3-tools-hub",
          href: MP3_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "audioToolsHubLabel", "Audio Tools"),
        },
      ],
    },
    {
      id: "image-design",
      titleKey: "imageDesignSectionTitle",
      viewAllLabelKey: "viewAllImageDesignTools",
      hubHref: "/tools/image-tools/",
      items: [
        {
          id: "jpg-tools-hub",
          href: JPG_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "jpgToolsHubLabel", "JPG Tools"),
        },
        {
          id: "png-tools-hub",
          href: PNG_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "pngToolsHubLabel", "PNG Tools"),
        },
        {
          id: "favicon-tools-hub",
          href: FAVICON_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "faviconToolsHubLabel", "Favicon Tools"),
        },
        {
          id: "crop-image",
          href: "/tools/image-tools/crop-image/",
          label: imageToolLabel(tHome, "cropImage", "Crop Image"),
        },
      ],
    },
    {
      id: "developer-security",
      titleKey: "developerSecuritySectionTitle",
      viewAllLabelKey: "viewAllDeveloperSecurityTools",
      hubHref: DEVELOPER_TOOLS_HUB_PATH,
      items: [
        {
          id: "json-tools-hub",
          href: JSON_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "jsonToolsHubLabel", "JSON Tools"),
        },
        {
          id: "yaml-tools-hub",
          href: YAML_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "yamlToolsHubLabel", "YAML Tools"),
        },
        {
          id: "hash-generator",
          href: "/tools/hash-generator/",
          label: toolLabel(tHome, "securityTools", "hashGenerator", "hash-generator"),
        },
        {
          id: "password-generator",
          href: "/tools/password-generator/",
          label: toolLabel(tHome, "securityTools", "passwordGenerator", "password-generator"),
        },
      ],
    },
    {
      id: "document-text",
      titleKey: "documentTextSectionTitle",
      viewAllLabelKey: "viewAllDocumentTextTools",
      hubHref: PDF_TOOLS_HUB_PATH,
      items: [
        {
          id: "pdf-tools-hub",
          href: PDF_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "pdfToolsHubLabel", "PDF Tools"),
        },
        {
          id: "extract-tools-hub",
          href: EXTRACT_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "extractToolsHubLabel", "Extract Tools"),
        },
        {
          id: "text-tools-hub",
          href: TEXT_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "textToolsHubLabel", "Text Tools"),
        },
        {
          id: "convert-tools-hub",
          href: CONVERT_TOOLS_HUB_PATH,
          label: hubLabel(tHome, "convertToolsHubLabel", "Conversion"),
        },
      ],
    },
  ];
}
