import { TEXT_TOOLS_HUB_PATH } from "@/lib/text-tools";
import {
  buildHomepageFeaturedTextJsonItems,
  type HomeFeaturedTextJsonItem,
} from "@/lib/text-json-tools";

export type HomeFeaturedUtilityItem =
  | HomeFeaturedTextJsonItem
  | {
      id: "text-tools-hub";
      href: string;
      label: string;
      iconKey: "letter-text";
    };

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

/** Homepage utilities strip — Text Tools hub first, then featured text utilities. */
export function buildHomepageFeaturedUtilityItems(tHome: HomeTranslator): HomeFeaturedUtilityItem[] {
  const hubLabel = tHome.has("textToolsHubLabel") ? tHome("textToolsHubLabel") : "Text Tools";

  const hubItem: HomeFeaturedUtilityItem = {
    id: "text-tools-hub",
    href: TEXT_TOOLS_HUB_PATH,
    label: hubLabel,
    iconKey: "letter-text",
  };

  return [hubItem, ...buildHomepageFeaturedTextJsonItems(tHome)];
}
