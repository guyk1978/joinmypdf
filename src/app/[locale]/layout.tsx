import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Providers } from "@/components/Providers";
import { CookieConsent } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ScrollDepthTracker } from "@/components/ScrollDepthTracker";
import { ShareButton } from "@/components/ShareButton";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`../../../messages/${locale}.json`)).default as {
    Metadata: { siteTitle: string; siteDescription: string };
  };

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
    },
    twitter: {
      card: "summary_large_image",
      title: messages.Metadata.siteTitle,
      description: messages.Metadata.siteDescription,
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
    <html lang={locale} dir={locale === "he" ? "rtl" : "ltr"} className={inter.variable} suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className="theme-transition font-sans">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ScrollDepthTracker />
            {children}
            <ShareButton />
            <CookieConsent />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
