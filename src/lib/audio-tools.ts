import { toolsList } from "@/data/tools";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import { MP3_TOOLS_HUB_PATH } from "@/lib/mp3-tools";
import { resolveToolHref } from "@/lib/tool-hierarchy";
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

/** Accepts canonical English IDs or localized SEO slugs (e.g. RU). */
export function getAudioToolById(id: string): ToolListEntry | undefined {
  const canonical = resolveCanonicalToolSlug(id);
  return toolsList.find((tool) => tool.id === canonical || tool.id === id);
}

export function isAudioToolId(id: string): boolean {
  return Boolean(getAudioToolById(id));
}

export const AUDIO_TOOL_IDS = toolsList.map((tool) => tool.id);

export function buildHomepageFeaturedAudioItems(
  tHome?: HomeTranslator,
  locale?: string,
): HomeFeaturedAudioItem[] {
  const hubLabel = tHome?.has("mp3ToolsHubLabel") ? tHome("mp3ToolsHubLabel") : "MP3 Tools Hub";

  const hubItem: HomeFeaturedAudioItem = {
    id: "mp3-tools-hub",
    href: MP3_TOOLS_HUB_PATH,
    label: hubLabel,
    iconKey: "file-audio",
  };

  const toolItems = toolsList.map((tool) => ({
    id: tool.id,
    href: resolveToolHref(tool.id, "mp3", locale),
    label: tool.name,
    iconKey: tool.iconKey,
  }));

  return [hubItem, ...toolItems];
}

export function buildHomeAudioToolItems(locale?: string): HomeAudioToolItem[] {
  return toolsList.map((tool) => ({
    id: tool.id,
    href: resolveToolHref(tool.id, "mp3", locale),
    label: tool.name,
    description: tool.title,
    iconKey: tool.iconKey,
  }));
}

