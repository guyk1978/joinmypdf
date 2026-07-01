import { registry } from "@/lib/registry";

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function isMissingHomeTranslation(value: string, key: string): boolean {
  if (!value) return true;
  if (value === key) return true;
  if (/^[A-Z][A-Z0-9_.]+$/.test(value) && value.includes(".")) return true;
  return false;
}

export function resolveHomeToolCopy(
  tHome: HomeTranslator,
  itemsNamespace: string,
  messageKey: string,
  field: "label" | "description",
  slug: string,
): string {
  const key = `${itemsNamespace}.items.${messageKey}.${field}`;
  if (tHome.has(key)) {
    const value = tHome(key);
    if (!isMissingHomeTranslation(value, key)) return value;
  }

  const tool = registry.tools.find((entry) => entry.slug === slug);
  if (tool) return field === "label" ? tool.title : tool.description;
  return messageKey;
}
