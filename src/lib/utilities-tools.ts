import {
  buildHomepageFeaturedTextJsonItems,
  type HomeFeaturedTextJsonItem,
} from "@/lib/text-json-tools";

export type HomeFeaturedUtilityItem = HomeFeaturedTextJsonItem;

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

/** Homepage utilities strip — text/JSON only (favicon has its own section). */
export function buildHomepageFeaturedUtilityItems(tHome: HomeTranslator): HomeFeaturedUtilityItem[] {
  return buildHomepageFeaturedTextJsonItems(tHome);
}
