export type HomeFaviconToolId =
  | "generate-favicon"
  | "png-to-ico"
  | "ico-to-png"
  | "svg-to-favicon"
  | "favicon-pack"
  | "apple-touch-icon"
  | "favicon-compressor"
  | "favicon-cropper"
  | "transparent-favicon"
  | "favicon-code-generator"
  | "favicon-previewer";

export type HomeFaviconToolIconKey =
  | "sparkles"
  | "file-image"
  | "image-down"
  | "file-code"
  | "layers"
  | "smartphone"
  | "minimize-2"
  | "crop"
  | "pipette"
  | "braces"
  | "panel-top";

export type HomeFaviconToolItem = {
  id: HomeFaviconToolId;
  href: string;
  label: string;
  description: string;
  iconKey: HomeFaviconToolIconKey;
};

const FAVICON_TOOL_META: Record<
  HomeFaviconToolId,
  { iconKey: HomeFaviconToolIconKey; messageKey: string }
> = {
  "generate-favicon": { iconKey: "sparkles", messageKey: "generateFavicon" },
  "png-to-ico": { iconKey: "file-image", messageKey: "pngToIco" },
  "ico-to-png": { iconKey: "image-down", messageKey: "icoToPng" },
  "svg-to-favicon": { iconKey: "file-code", messageKey: "svgToFavicon" },
  "favicon-pack": { iconKey: "layers", messageKey: "faviconPack" },
  "apple-touch-icon": { iconKey: "smartphone", messageKey: "appleTouchIcon" },
  "favicon-compressor": { iconKey: "minimize-2", messageKey: "faviconCompressor" },
  "favicon-cropper": { iconKey: "crop", messageKey: "faviconCropper" },
  "transparent-favicon": { iconKey: "pipette", messageKey: "transparentFavicon" },
  "favicon-code-generator": { iconKey: "braces", messageKey: "faviconCodeGenerator" },
  "favicon-previewer": { iconKey: "panel-top", messageKey: "faviconPreviewer" },
};

export const HOME_FAVICON_TOOL_IDS = Object.keys(FAVICON_TOOL_META) as HomeFaviconToolId[];

/** Homepage — 3 most popular favicon tools */
export const HOMEPAGE_FEATURED_FAVICON_IDS = [
  "generate-favicon",
  "png-to-ico",
  "ico-to-png",
] as const;

export type HomeFeaturedFaviconItem = {
  id: HomeFaviconToolId;
  href: string;
  label: string;
  iconKey: HomeFaviconToolIconKey;
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function buildHomepageFeaturedFaviconItems(tHome: HomeTranslator): HomeFeaturedFaviconItem[] {
  return HOMEPAGE_FEATURED_FAVICON_IDS.map((id) => {
    const meta = FAVICON_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: tHome(`faviconTools.items.${meta.messageKey}.label`),
      iconKey: meta.iconKey,
    };
  });
}

export function buildHomeFaviconToolItems(tHome: HomeTranslator): HomeFaviconToolItem[] {
  return HOME_FAVICON_TOOL_IDS.map((id) => {
    const meta = FAVICON_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: tHome(`faviconTools.items.${meta.messageKey}.label`),
      description: tHome(`faviconTools.items.${meta.messageKey}.description`),
      iconKey: meta.iconKey,
    };
  });
}
