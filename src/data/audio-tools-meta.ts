import raw from "../../assets/data/audio-tools.json";

/**
 * Plain audio-tool metadata (no React components) for inventory + sitemap.
 * Keep in sync with `src/data/tools.ts` component registry.
 */
export type AudioToolMeta = {
  slug: string;
  title: string;
  description: string;
};

export const AUDIO_TOOLS_META = raw as readonly AudioToolMeta[];

export const AUDIO_TOOL_META_SLUGS = AUDIO_TOOLS_META.map((tool) => tool.slug);
