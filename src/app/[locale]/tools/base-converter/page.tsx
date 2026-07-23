import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { BaseConverterIntroGate } from "@/components/BaseConverterIntroGate";
import { BaseConverterWorkspace } from "@/components/tools/unit-math/BaseConverterWorkspace";
import { routing } from "@/i18n/routing";
import { getLocalizedToolFaqs } from "@/lib/i18n-tool-page";
import { registry } from "@/lib/registry";
import { breadcrumbLd, faqLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { buildToolPageBreadcrumbs } from "@/lib/tool-breadcrumb-hub";
import { productPageMainClassName } from "@/lib/tool-ui";
import { notFound } from "next/navigation";

const SLUG = "base-converter";
const PAGE_PATH = `/tools/${SLUG}/`;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BaseConverterPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${PAGE_PATH}`,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${PAGE_PATH}`]),
      ),
    },
  };
}

export default async function BaseConverterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tool = registry.tools.find((entry) => entry.slug === SLUG);
  if (!tool) notFound();

  const t = await getTranslations("BaseConverterPage");
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
            t("schemaFeatureBases"),
            t("schemaFeatureLive"),
            t("schemaFeatureBitwise"),
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
            <h1 className="sr-only">{t("title")}</h1>
            <BaseConverterIntroGate>
              <BaseConverterWorkspace tool={tool} slug={SLUG} />
            </BaseConverterIntroGate>
          </section>
</div>
      </AppPageShell>
    </>
  );
}
