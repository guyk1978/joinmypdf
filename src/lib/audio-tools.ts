import { toolsList } from "@/data/tools";
import { MP3_TOOLS_HUB_PATH } from "@/lib/mp3-tools";
import type { HomeAudioToolIconKey, ToolListEntry } from "@/lib/tool-module";

export type HomeFeaturedAudioItem = {
  id: string;
  href: string;
  label: string;
  iconKey: HomeAudioToolIconKey;
};

export type HomeAudioToolItem = HomeFeaturedAudioItem & {
  description: string;
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function getAudioToolById(id: string): ToolListEntry | undefined {
  return toolsList.find((tool) => tool.id === id);
}

export function isAudioToolId(id: string): boolean {
  return toolsList.some((tool) => tool.id === id);
}

export const AUDIO_TOOL_IDS = toolsList.map((tool) => tool.id);

export function buildHomepageFeaturedAudioItems(tHome?: HomeTranslator): HomeFeaturedAudioItem[] {
  const hubLabel = tHome?.has("mp3ToolsHubLabel") ? tHome("mp3ToolsHubLabel") : "MP3 Tools Hub";

  const hubItem: HomeFeaturedAudioItem = {
    id: "mp3-tools-hub",
    href: MP3_TOOLS_HUB_PATH,
    label: hubLabel,
    iconKey: "file-audio",
  };

  const toolItems = toolsList.map((tool) => ({
    id: tool.id,
    href: `/tools/${tool.id}/`,
    label: tool.name,
    iconKey: tool.iconKey,
  }));

  return [hubItem, ...toolItems];
}

export function buildHomeAudioToolItems(): HomeAudioToolItem[] {
  return toolsList.map((tool) => ({
    id: tool.id,
    href: `/tools/${tool.id}/`,
    label: tool.name,
    description: tool.title,
    iconKey: tool.iconKey,
  }));
}

