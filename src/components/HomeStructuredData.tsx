import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBrandName } from "@/lib/brand";
import { absoluteUrl } from "@/lib/site";
import { faqLd, homeSoftwareApplicationLd, JsonLd } from "@/lib/schema";

const HOME_FAQ_KEYS = ["upload", "free", "professional"] as const;

type HomeStructuredDataProps = {
  locale: string;
};

export async function HomeStructuredData({ locale }: HomeStructuredDataProps) {
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const tMeta = await getTranslations("Metadata");

  const homeFaqs = HOME_FAQ_KEYS.map((key) => ({
    q: tHome(`faq.${key}.q`),
    a: tHome(`faq.${key}.a`),
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: getBrandName(locale),
          url: absoluteUrl(`/${locale}/home`),
          description: tMeta("homeDescription"),
        }}
      />
      <JsonLd
        data={homeSoftwareApplicationLd({
          locale,
          name: getBrandName(locale),
          description: tMeta("homeDescription"),
          pathname: `/${locale}/home`,
        })}
      />
      <JsonLd data={faqLd(homeFaqs)} />
    </>
  );
}
