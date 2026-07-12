import { resolveHomeToolCopy } from "@/lib/home-tool-copy";

export type HomeDesignToolId = "color-converter";

export type HomeDesignToolIconKey = "palette";

export type HomeDesignToolItem = {
  id: HomeDesignToolId;
  href: string;
  label: string;
  description: string;
  iconKey: HomeDesignToolIconKey;
};

const DESIGN_TOOL_META: Record<
  HomeDesignToolId,
  { iconKey: HomeDesignToolIconKey; messageKey: string }
> = {
  "color-converter": { iconKey: "palette", messageKey: "colorConverter" },
};

const DESIGN_ITEMS_NS = "designTools";

export const HOME_DESIGN_TOOL_IDS = Object.keys(DESIGN_TOOL_META) as HomeDesignToolId[];

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function buildHomeDesignToolItems(tHome: HomeTranslator): HomeDesignToolItem[] {
  return HOME_DESIGN_TOOL_IDS.map((id) => {
    const meta = DESIGN_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveHomeToolCopy(tHome, DESIGN_ITEMS_NS, meta.messageKey, "label", id),
      description: resolveHomeToolCopy(tHome, DESIGN_ITEMS_NS, meta.messageKey, "description", id),
      iconKey: meta.iconKey,
    };
  });
}
