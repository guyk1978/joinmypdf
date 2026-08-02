import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { DeferredCookieConsent } from "@/components/DeferredCookieConsent";
import type { AbstractIntlMessages } from "next-intl";
import "@/styles/critical-splash.css";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/** Splash-only client messages — keep the locale-root HTML payload tiny. */
function pickSplashMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const home = messages.Home;
  let splash: AbstractIntlMessages | string | undefined;
  if (home && typeof home === "object" && "splash" in home) {
    splash = (home as AbstractIntlMessages).splash as AbstractIntlMessages | string;
  }
  const picked: AbstractIntlMessages = {};
  if (messages.CookieConsent !== undefined) {
    picked.CookieConsent = messages.CookieConsent;
  }
  if (splash !== undefined) {
    picked.Home = { splash };
  }
  return picked;
}

/**
 * Welcome route group — critical CSS only, no sitewide globals / Providers.
 */
export default async function WelcomeLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={pickSplashMessages(messages)}>
      {children}
      <DeferredCookieConsent />
    </NextIntlClientProvider>
  );
}
