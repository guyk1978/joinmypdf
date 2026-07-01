import {
  buildHomeFaviconToolItems,
  buildHomepageFeaturedFaviconItems,
  type HomeFaviconToolItem,
  type HomeFeaturedFaviconItem,
} from "@/lib/favicon-tools";
import {
  buildHomeTextJsonToolItems,
  buildHomepageFeaturedTextJsonItems,
  type HomeFeaturedTextJsonItem,
  type HomeTextJsonToolItem,
} from "@/lib/text-json-tools";

export type HomeFeaturedUtilityItem = HomeFeaturedFaviconItem | HomeFeaturedTextJsonItem;

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function buildHomepageFeaturedUtilityItems(tHome: HomeTranslator): HomeFeaturedUtilityItem[] {
  return [
    ...buildHomepageFeaturedFaviconItems(tHome),
    ...buildHomepageFeaturedTextJsonItems(tHome),
  ];
}

export function buildHomeUtilityToolSections(tHome: HomeTranslator): {
  faviconItems: HomeFaviconToolItem[];
  textJsonItems: HomeTextJsonToolItem[];
} {
  return {
    faviconItems: buildHomeFaviconToolItems(tHome),
    textJsonItems: buildHomeTextJsonToolItems(tHome),
  };
}
