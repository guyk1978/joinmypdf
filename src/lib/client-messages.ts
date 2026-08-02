import type { AbstractIntlMessages } from "next-intl";

/**
 * Interactive UI rendered on nearly every app route (not the welcome splash).
 * Large page-copy namespaces stay server-only or route-scoped via RouteIntlProvider.
 */
export const SHARED_CLIENT_MESSAGE_NAMESPACES = [
  "Header",
  "Favorites",
  "Tools",
  "Projects",
  "LanguageSwitcher",
  "Share",
  "Home",
  "ToolsDirectory",
  "Footer",
  "CookieConsent",
  "ToolModal",
  "Blog",
  "Feedback",
  "Rating",
  "ToolCard",
  "PinnedDock",
  "ToolSidebarBanners",
  "Reviews",
] as const;

export function pickMessageNamespaces(
  messages: AbstractIntlMessages,
  namespaces: readonly string[],
): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const namespace of namespaces) {
    const value = messages[namespace];
    if (value !== undefined) picked[namespace] = value;
  }
  return picked;
}

/** Full route messages except the large ToolPage bundle loaded as one shared asset. */
export function pickInteractiveRouteMessages(
  messages: AbstractIntlMessages,
): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const [namespace, value] of Object.entries(messages)) {
    if (namespace !== "ToolPage") picked[namespace] = value;
  }
  return picked;
}
