import { toolsList } from "@/data/tools";
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

export function getAudioToolById(id: string): ToolListEntry | undefined {
  return toolsList.find((tool) => tool.id === id);
}

export function isAudioToolId(id: string): boolean {
  return toolsList.some((tool) => tool.id === id);
}

export const AUDIO_TOOL_IDS = toolsList.map((tool) => tool.id);

export function buildHomepageFeaturedAudioItems(): HomeFeaturedAudioItem[] {
  return toolsList.map((tool) => ({
    id: tool.id,
    href: `/tools/${tool.id}/`,
    label: tool.name,
    iconKey: tool.iconKey,
  }));
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

