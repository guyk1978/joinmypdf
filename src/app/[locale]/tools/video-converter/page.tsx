import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { ToolBreadcrumbs } from "@/components/layout/ToolBreadcrumbs";
import { buildToolPageBreadcrumbs } from "@/lib/tool-breadcrumb-hub";
import { RelatedTools } from "@/components/RelatedTools";
import { VideoConverterWorkspace } from "@/components/tools/VideoConverterWorkspace";
import { VideoConverterIntroGate } from "@/components/VideoConverterIntroGate";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import { routing } from "@/i18n/routing";
import { registry } from "@/lib/registry";
import { breadcrumbLd, JsonLd, webApplicationLd, faqLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";
import { notFound } from "next/navigation";
import { getLocalizedToolFaqs } from "@/lib/i18n-tool-page";

const SLUG = "video-converter";
const PAGE_PATH = `/tools/${SLUG}/`;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "VideoConverterPage" });

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

export default async function VideoConverterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tool = registry.tools.find((entry) => entry.slug === SLUG);
  if (!tool) notFound();

  const t = await getTranslations("VideoConverterPage");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${PAGE_PATH}`;
  const faqs = getLocalizedToolFaqs(tPage, tool, null, t("title"), locale);
  const crumbs = buildToolPageBreadcrumbs({
    slug: SLUG,
    toolTitle: t("title"),
    toolPath: PAGE_PATH,
    tPage,
  });

  const breadcrumbItems = crumbs.map((crumb) => ({ label: crumb.name, href: crumb.path }));

  return (
    <>
      <JsonLd
        data={webApplicationLd({
          name: t("schemaName"),
          description: t("schemaDescription"),
          pathname,
          locale,
          featureList: [
            t("schemaFeatureFormats"),
            t("schemaFeatureCodecs"),
            t("schemaFeatureTargets"),
            t("schemaFeatureLocal"),
          ],
          applicationCategory: "MultimediaApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      {faqs.length ? <JsonLd data={faqLd(faqs)} /> : null}
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
            <h1 className="sr-only">{t("title")}</h1>
<section className="border-b border-[#262626] pb-8" aria-label={t("title")}>
            <ToolPageShellProvider headline={t("title")} subline={t("description")} slug={SLUG}>
              <VideoConverterIntroGate active={tool.operation === "video-converter"}>
                <VideoConverterWorkspace tool={tool} slug={SLUG} />
              </VideoConverterIntroGate>
            </ToolPageShellProvider>
          </section>
</div>
      </AppPageShell>
    </>
  );
}
