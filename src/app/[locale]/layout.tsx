import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { CookieConsent } from "@/components/CookieConsent";
import { DocumentLocaleAttributes } from "@/components/DocumentLocaleAttributes";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Providers } from "@/components/Providers";
import { ScrollDepthTracker } from "@/components/ScrollDepthTracker";
import { routing } from "@/i18n/routing";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { siteUrl } from "@/lib/site";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

function LocaleHtmlBootstrap({ locale }: { locale: string }) {
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang="${locale}";document.documentElement.dir="${dir}";`,
      }}
    />
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`../../../messages/${locale}.json`)).default as {
    Metadata: { siteTitle: string; siteDescription: string };
  };

  const social = buildDefaultSocialImages(locale, { alt: messages.Metadata.siteTitle });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: messages.Metadata.siteTitle,
      template: "%s | JoinMyPDF",
    },
    description: messages.Metadata.siteDescription,
    openGraph: {
      type: "website",
      siteName: "JoinMyPDF",
      title: messages.Metadata.siteTitle,
      description: messages.Metadata.siteDescription,
      url: `/${locale}`,
      locale: locale === "he" ? "he_IL" : "en_US",
      ...social.openGraph,
    },
    twitter: {
      title: messages.Metadata.siteTitle,
      description: messages.Metadata.siteDescription,
      ...social.twitter,
    },
    robots: { index: true, follow: true },
    manifest: "/manifest.webmanifest",
    alternates: {
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}`])),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleHtmlBootstrap locale={locale} />
      <DocumentLocaleAttributes />
      <GoogleAnalytics />
      <Providers>
        <ScrollDepthTracker />
        {children}
        <CookieConsent />
      </Providers>
    </NextIntlClientProvider>
  );
}
