import { MP4_TOOLS_HUB_PATH } from "@/lib/mp4-tools";
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

const FEATURED_VIDEO_SLUGS = ["video-to-mp4", "video-compressor", "video-resizer"] as const;

const VIDEO_ICON_KEYS: Record<(typeof FEATURED_VIDEO_SLUGS)[number], HomeFeaturedVideoItem["iconKey"]> = {
  "video-to-mp4": "video",
  "video-compressor": "minimize-2",
  "video-resizer": "expand",
};

export function buildHomepageFeaturedVideoItems(tHome?: HomeTranslator): HomeFeaturedVideoItem[] {
  const hubLabel = tHome?.has("mp4ToolsHubLabel") ? tHome("mp4ToolsHubLabel") : "MP4 Tools Hub";

  const hubItem: HomeFeaturedVideoItem = {
    id: "mp4-tools-hub",
    href: MP4_TOOLS_HUB_PATH,
    label: hubLabel,
    iconKey: "video",
  };

  const toolItems = FEATURED_VIDEO_SLUGS.map((slug) => {
    const tool = registry.tools.find((entry) => entry.slug === slug);
    return {
      id: slug,
      href: `/tools/${slug}/`,
      label: tool?.title ?? slug,
      iconKey: VIDEO_ICON_KEYS[slug],
    };
  });

  return [hubItem, ...toolItems];
}
