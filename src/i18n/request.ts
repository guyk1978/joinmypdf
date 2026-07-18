import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { localizeHebrewPdfDeep } from "@/lib/hebrew-pdf-term";
import { routing } from "./routing";

function mergeTools(
  base: Record<string, unknown> | undefined,
  extra: Record<string, unknown> | undefined,
) {
  if (!extra) return base;
  if (!base) return extra;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const existing = merged[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      merged[key] = { ...(existing as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const base = (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>;
  let extension: Record<string, unknown> = {};
  try {
    extension = (await import(`../../messages/locale-extensions/${locale}.json`)).default;
  } catch {
    // Optional extension bundle for large translation sets.
  }

  const { Tools: extraTools, ...restExtension } = extension as {
    Tools?: Record<string, unknown>;
    [key: string]: unknown;
  };

  const messages = {
    ...base,
    ...restExtension,
    Tools: mergeTools(base.Tools as Record<string, unknown>, extraTools),
  };

  return {
    locale,
    messages: locale === "he" ? localizeHebrewPdfDeep(messages) : messages,
  };
});
