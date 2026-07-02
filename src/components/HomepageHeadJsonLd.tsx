import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getBrandName } from "@/lib/brand";
import { absoluteUrl } from "@/lib/site";
import { faqLd, homeSoftwareApplicationLd, serializeJsonLd } from "@/lib/schema";

const HOME_FAQ_KEYS = ["upload", "free", "professional"] as const;

function isHomePathname(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  for (const locale of routing.locales) {
    if (normalized === `/${locale}`) return locale;
  }
  return null;
}

function JsonLdHeadScript({ id, data }: { id: string; data: unknown }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

export async function HomepageHeadJsonLd() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const locale = isHomePathname(pathname);
  if (!locale) return null;

  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const tMeta = await getTranslations("Metadata");

  const homeFaqs = HOME_FAQ_KEYS.map((key) => ({
    q: tHome(`faq.${key}.q`),
    a: tHome(`faq.${key}.a`),
  }));

  const softwareApplication = homeSoftwareApplicationLd({
    locale,
    name: getBrandName(locale),
    description: tMeta("homeDescription"),
    pathname: `/${locale}`,
  });

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: getBrandName(locale),
    url: absoluteUrl(`/${locale}`),
    description: tMeta("homeDescription"),
  };

  return (
    <>
      <JsonLdHeadScript id="home-website-ld" data={website} />
      <JsonLdHeadScript id="home-software-application-ld" data={softwareApplication} />
      <JsonLdHeadScript id="home-faq-ld" data={faqLd(homeFaqs)} />
    </>
  );
}
