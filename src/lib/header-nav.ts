export type HeaderNavDropdownId = "convert" | "compress" | "resize" | "security" | "design";

/** @deprecated Import from `@/config/tools` or `@/lib/tool-registry`. */
export {
  TOOL_DEFINITIONS,
  TOOL_REGISTRY,
  ALL_TOOLS_REGISTRY,
  MEGA_MENU_CONFIG,
  HEADER_CATEGORY_BUTTONS,
  HEADER_CATEGORY_IDS,
  getToolRegistryCategory,
  isRegistryTool,
  toolPath,
} from "@/config/tools";

export type { HeaderCategoryId, ToolRegistryCategory } from "@/config/tools";

export {
  buildAllToolsNav,
  buildCategoryNav,
  buildFooterToolsColumns,
  buildHeaderNavDropdowns,
  buildMegaMenuNav,
  getCategoryTitleKey,
} from "@/lib/tool-registry";

export { buildSearchIndex } from "@/lib/search-index";
export type { SearchIndexEntry, SearchAssetType } from "@/config/tools";
