import { MP4_TOOLS_HUB_PATH } from "@/lib/mp4-tools";
import { VIDEO_TOOLS_HUB_PATH } from "@/lib/video-tools-hub";
import { VIDEO_TOOLS_INVENTORY_IDS } from "@/data/tools-inventory";
import { registry } from "@/lib/registry";

export type HomeFeaturedVideoItem = {
  id: string;
  href: string;
  label: string;
  iconKey: "video" | "minimize-2" | "expand" | "rotate-cw" | "file-audio";
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

const FEATURED_VIDEO_SLUGS = ["video-converter", "video-compressor", "video-resizer"] as const;

const VIDEO_ICON_KEYS: Record<(typeof FEATURED_VIDEO_SLUGS)[number], HomeFeaturedVideoItem["iconKey"]> = {
  "video-converter": "video",
  "video-compressor": "minimize-2",
  "video-resizer": "expand",
};

export function buildHomepageFeaturedVideoItems(tHome?: HomeTranslator): HomeFeaturedVideoItem[] {
  const videoHubLabel = tHome?.has("videoToolsHubLabel")
    ? tHome("videoToolsHubLabel")
    : "Video Tools";
  const mp4HubLabel = tHome?.has("mp4ToolsHubLabel") ? tHome("mp4ToolsHubLabel") : "MP4 Tools Hub";

  const hubItems: HomeFeaturedVideoItem[] = [
    {
      id: "video-tools-hub",
      href: VIDEO_TOOLS_HUB_PATH,
      label: videoHubLabel,
      iconKey: "video",
    },
    {
      id: "mp4-tools-hub",
      href: MP4_TOOLS_HUB_PATH,
      label: mp4HubLabel,
      iconKey: "video",
    },
  ];

  const toolItems = FEATURED_VIDEO_SLUGS.map((slug) => {
    const tool = registry.tools.find((entry) => entry.slug === slug);
    return {
      id: slug,
      href: `/tools/${slug}/`,
      label: tool?.title ?? slug,
      iconKey: VIDEO_ICON_KEYS[slug],
    };
  });

  return [...hubItems, ...toolItems];
}

/** Slugs for the canonical Video Tools set (same 10 as MP4 hub). */
export const CORE_VIDEO_TOOL_IDS = VIDEO_TOOLS_INVENTORY_IDS;
