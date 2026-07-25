import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { PdfReaderIntroGate } from "@/components/PdfReaderIntroGate";
import { PdfReaderWorkspace } from "@/components/PdfReaderWorkspace";
import { routing } from "@/i18n/routing";
import { getLocalizedToolFaqs } from "@/lib/i18n-tool-page";
import { registry } from "@/lib/registry";
import { breadcrumbLd, faqLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { getBrandName } from "@/lib/brand";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { siteUrl } from "@/lib/site";
import { pdfReaderOgImagePath } from "@/lib/tool-seo";
import { buildToolPageBreadcrumbs } from "@/lib/tool-breadcrumb-hub";
import { productPageMainClassName } from "@/lib/tool-ui";
import { notFound } from "next/navigation";

const SLUG = "pdf-reader";
const PAGE_PATH = `/tools/${SLUG}/`;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PdfReaderPage" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}${PAGE_PATH}`;
  const social = buildDefaultSocialImages(locale, {
    alt: title,
    imagePath: pdfReaderOgImagePath(locale),
  });
  const ogLocale = locale === "he" ? "he_IL" : locale === "ru" ? "ru_RU" : "en_US";

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${PAGE_PATH}`]),
      ),
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: getBrandName(locale),
      type: "website",
      locale: ogLocale,
      ...social.openGraph,
    },
    twitter: {
      title,
      description,
      ...social.twitter,
    },
  };
}

export default async function PdfReaderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tool = registry.tools.find((entry) => entry.slug === SLUG);
  if (!tool) notFound();

  const t = await getTranslations("PdfReaderPage");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${PAGE_PATH}`;
  const faqs = getLocalizedToolFaqs(tPage, tool, null, t("title"), locale);

  const crumbs = buildToolPageBreadcrumbs({
    slug: SLUG,
    toolTitle: t("title"),
    toolPath: PAGE_PATH,
    tPage,
  });

  return (
    <>
      <JsonLd
        data={webApplicationLd({
          name: t("schemaName"),
          description: t("schemaDescription"),
          pathname,
          locale,
          featureList: [
            t("schemaFeatureRead"),
            t("schemaFeatureNav"),
            t("schemaFeatureZoom"),
            t("schemaFeatureLocal"),
          ],
          applicationCategory: "UtilitiesApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      {faqs.length ? <JsonLd data={faqLd(faqs)} /> : null}

      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
          <section className="border-b border-[#262626] pb-8" aria-label={t("title")}>
            <PdfReaderIntroGate>
              <PdfReaderWorkspace tool={tool} slug={SLUG} />
            </PdfReaderIntroGate>
          </section>
        </div>
      </AppPageShell>
    </>
  );
}
