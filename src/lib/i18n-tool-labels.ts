type ToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function translateToolGridCategory(t: ToolsTranslator, categoryId: string): string {
  const key = `gridCategories.${categoryId}`;
  return t.has(key) ? t(key) : categoryId;
}

export function translateToolSection(
  t: ToolsTranslator,
  sectionId: string,
  fallback: string,
): string {
  const key = `sections.${sectionId}`;
  return t.has(key) ? t(key) : fallback;
}

export function translateToolItem(t: ToolsTranslator, slug: string, fallback: string): string {
  const key = `items.${slug}`;
  return t.has(key) ? t(key) : fallback;
}
