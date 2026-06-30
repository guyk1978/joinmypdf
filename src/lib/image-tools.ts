export type HomeImageToolId =
  | "resize-image"
  | "convert-to-png"
  | "crop-image"
  | "rotate-image"
  | "compress-image"
  | "heic-to-jpg";

export type HomeImageToolIconKey =
  | "expand"
  | "file-image"
  | "crop"
  | "rotate-cw"
  | "minimize-2"
  | "image-down";

export type HomeImageToolItem = {
  id: HomeImageToolId;
  href: string;
  label: string;
  description: string;
  iconKey: HomeImageToolIconKey;
};

const IMAGE_TOOL_META: Record<
  HomeImageToolId,
  { iconKey: HomeImageToolIconKey; messageKey: string }
> = {
  "resize-image": { iconKey: "expand", messageKey: "resizeImage" },
  "convert-to-png": { iconKey: "file-image", messageKey: "convertToPng" },
  "crop-image": { iconKey: "crop", messageKey: "cropImage" },
  "rotate-image": { iconKey: "rotate-cw", messageKey: "rotateImage" },
  "compress-image": { iconKey: "minimize-2", messageKey: "compressImage" },
  "heic-to-jpg": { iconKey: "image-down", messageKey: "heicToJpg" },
};

export const HOME_IMAGE_TOOL_IDS = Object.keys(IMAGE_TOOL_META) as HomeImageToolId[];

/** Homepage — 3 most popular image tools */
export const HOMEPAGE_FEATURED_IMAGE_IDS = ["crop-image", "resize-image", "compress-image"] as const;

export type HomeFeaturedImageItem = {
  id: HomeImageToolId;
  href: string;
  label: string;
  iconKey: HomeImageToolIconKey;
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function buildHomepageFeaturedImageItems(tHome: HomeTranslator): HomeFeaturedImageItem[] {
  return HOMEPAGE_FEATURED_IMAGE_IDS.map((id) => {
    const meta = IMAGE_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: tHome(`imageTools.items.${meta.messageKey}.label`),
      iconKey: meta.iconKey,
    };
  });
}

export function buildHomeImageToolItems(tHome: HomeTranslator): HomeImageToolItem[] {
  return HOME_IMAGE_TOOL_IDS.map((id) => {
    const meta = IMAGE_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: tHome(`imageTools.items.${meta.messageKey}.label`),
      description: tHome(`imageTools.items.${meta.messageKey}.description`),
      iconKey: meta.iconKey,
    };
  });
}
