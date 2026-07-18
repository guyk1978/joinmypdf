import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { CookieConsent } from "@/components/CookieConsent";
import { DocumentLocaleAttributes } from "@/components/DocumentLocaleAttributes";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Providers } from "@/components/Providers";
import { PwaServiceWorkerRegister } from "@/components/PwaServiceWorkerRegister";
import { ScrollDepthTracker } from "@/components/ScrollDepthTracker";
import { routing } from "@/i18n/routing";
import { getBrandName } from "@/lib/brand";
import { buildDefaultSocialImages } from "@/lib/og-images";
import {
  PWA_BACKGROUND_COLOR,
  PWA_THEME_COLOR,
  siteIconMetadata,
} from "@/lib/site-icons";
import { siteUrl } from "@/lib/site";

type Props = {
  children: React.ReactNode;
  modal: React.ReactNode;
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const brandName = getBrandName(locale);

  const siteTitle = "JoinMyPDF | Professional PDF Workspace";
  const siteDescription =
    "The ultimate workspace for managing your PDF files. Merge, split, organize, and annotate seamlessly.";

  const social = buildDefaultSocialImages(locale, {
    alt: "JoinMyPDF Multi-Note Manager preview",
  });

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
      url: `${siteUrl}/`,
      locale: locale === "he" ? "he_IL" : locale === "ru" ? "ru_RU" : "en_US",
      ...social.openGraph,
    },
    twitter: {
      title: siteTitle,
      description: siteDescription,
      ...social.twitter,
    },
    robots: { index: true, follow: true },
    manifest: "/manifest.webmanifest",
    icons: siteIconMetadata,
    themeColor: PWA_THEME_COLOR,
    appleWebApp: {
      capable: true,
      title: brandName,
      statusBarStyle: "black-translucent",
    },
    other: {
      "msapplication-TileColor": PWA_BACKGROUND_COLOR,
    },
    alternates: {
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}`])),
    },
  };
}

export default async function LocaleLayout({ children, modal, params }: Props) {
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
      <PwaServiceWorkerRegister />
      <Providers>
        <ScrollDepthTracker />
        {children}
        {modal}
        <CookieConsent />
      </Providers>
    </NextIntlClientProvider>
  );
}
