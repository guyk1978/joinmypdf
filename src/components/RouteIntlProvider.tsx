import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import {
  pickInteractiveRouteMessages,
  pickMessageNamespaces,
  SHARED_CLIENT_MESSAGE_NAMESPACES,
} from "@/lib/client-messages";
import type { ReactNode } from "react";

/**
 * Compatibility boundary for highly interactive route families.
 * ToolPage copy remains external; the rest is scoped to these routes only.
 */
export async function RouteIntlProvider({
  children,
  namespaces,
}: {
  children: ReactNode;
  namespaces?: readonly string[];
}) {
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
