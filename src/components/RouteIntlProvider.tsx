import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  pickInteractiveRouteMessages,
  pickMessageNamespaces,
  SHARED_CLIENT_MESSAGE_NAMESPACES,
} from "@/lib/client-messages";
import type { ReactNode } from "react";

/**
 * Compatibility boundary for highly interactive route families.
 * ToolPage copy remains external; the rest is scoped to these routes only.
 *
 * Must receive `locale` and call `setRequestLocale` so static export never
 * falls back to request headers while loading messages.
 */
export async function RouteIntlProvider({
  children,
  locale,
  namespaces,
}: {
  children: ReactNode;
  locale: string;
  namespaces?: readonly string[];
}) {
  setRequestLocale(locale);
  const messages = await getMessages();
  const clientMessages = namespaces
    ? pickMessageNamespaces(messages, [
        ...SHARED_CLIENT_MESSAGE_NAMESPACES,
        ...namespaces,
      ])
    : pickInteractiveRouteMessages(messages);

  return (
    <NextIntlClientProvider messages={clientMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
