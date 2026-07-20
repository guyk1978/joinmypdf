import type { CSSProperties } from "react";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentCssVar,
  resolveToolAccentCategoryId,
} from "@/lib/category-accent-colors";

/** Inline `--category-accent` for homepage cards / pills. */
export function homeToolAccentStyle(toolId: string): CSSProperties {
  const accentId = resolveToolAccentCategoryId(toolId) ?? "pdf";
  return {
    "--category-accent": getCategoryAccentCssVar(accentId),
  } as CSSProperties;
}

export function homeCategoryAccentStyle(
  categoryId: InventoryCategoryId | string,
): CSSProperties {
  return {
    "--category-accent": getCategoryAccentCssVar(categoryId),
  } as CSSProperties;
}
