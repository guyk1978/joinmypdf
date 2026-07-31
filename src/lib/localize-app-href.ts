import { routing } from "@/i18n/routing";

/**
 * Prefix an internal app path with the active locale for use on native `<a>` tags
 * (e.g. tool-card go links that must open with target="_blank").
 */
export function localizeAppHref(href: string, locale: string): string {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:|\/\/)/i.test(href) || href.startsWith("#")) {
    return href;
  }

  try {
    const url = new URL(href, "https://joinmypdf.local");
    let pathname = url.pathname || "/";

    for (const loc of routing.locales) {
      if (pathname === `/${loc}`) {
        pathname = "/";
        break;
      }
      if (pathname.startsWith(`/${loc}/`)) {
        pathname = pathname.slice(loc.length + 1);
        if (!pathname.startsWith("/")) pathname = `/${pathname}`;
        break;
      }
    }

    if (!pathname.startsWith("/")) pathname = `/${pathname}`;
    return `/${locale}${pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}
