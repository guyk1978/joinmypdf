import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { DeferredCookieConsent } from "@/components/DeferredCookieConsent";
import { DocumentLocaleAttributes } from "@/components/DocumentLocaleAttributes";
import { Providers } from "@/components/Providers";
import { ScrollDepthTracker } from "@/components/ScrollDepthTracker";
import {
  pickMessageNamespaces,
  SHARED_CLIENT_MESSAGE_NAMESPACES,
} from "@/lib/client-messages";
import "@/app/globals.css";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Main app route group — full design system CSS + interactive providers.
 */
export default async function SiteLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const clientMessages = pickMessageNamespaces(
    messages,
    SHARED_CLIENT_MESSAGE_NAMESPACES,
  );

  return (
    <NextIntlClientProvider locale={locale} messages={clientMessages}>
      <DocumentLocaleAttributes />
      <Providers>
        <ScrollDepthTracker />
        {children}
        <DeferredCookieConsent />
      </Providers>
    </NextIntlClientProvider>
  );
}
