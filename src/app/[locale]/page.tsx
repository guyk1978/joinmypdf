import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WelcomeSplash } from "@/components/WelcomeSplash";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("splash.metaTitle"),
    description: t("splash.metaDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}`])),
    },
  };
}

/** Locale root — immersive welcome splash before the main dashboard. */
export default async function WelcomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WelcomeSplash />;
}
