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
import { getBrandName } from "@/lib/brand";
import { localizeHebrewCopyInText } from "@/lib/hebrew-pdf-term";
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

  const siteTitle =
    locale === "he"
      ? localizeHebrewCopyInText(messages.Metadata.siteTitle)
      : messages.Metadata.siteTitle;
  const siteDescription =
    locale === "he"
      ? localizeHebrewCopyInText(messages.Metadata.siteDescription)
      : messages.Metadata.siteDescription;
  const brandName = getBrandName(locale);

  const social = buildDefaultSocialImages(locale, { alt: siteTitle });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteTitle,
      template: `%s | ${brandName}`,
    },
    description: siteDescription,
    openGraph: {
      type: "website",
      siteName: brandName,
      title: siteTitle,
      description: siteDescription,
      url: `/${locale}`,
      locale: locale === "he" ? "he_IL" : "en_US",
      ...social.openGraph,
    },
    twitter: {
      title: siteTitle,
      description: siteDescription,
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
