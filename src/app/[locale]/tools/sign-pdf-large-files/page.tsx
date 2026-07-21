import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { SignPdfWorkspace } from "@/components/SignPdfWorkspace";
import { routing } from "@/i18n/routing";
import { PDF_TOOLS_HUB_PATH } from "@/lib/pdf-tools-hub";
import { registry } from "@/lib/registry";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

const SLUG = "sign-pdf-large-files";
const WORKSPACE_SLUG = "sign-pdf";
const PAGE_PATH = `/tools/${SLUG}/`;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SignPdfLargeFilesPage" });

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

export default async function SignPdfLargeFilesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tool = registry.tools.find((entry) => entry.slug === WORKSPACE_SLUG);
  if (!tool) notFound();

  const t = await getTranslations("SignPdfLargeFilesPage");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${PAGE_PATH}`;

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubPdf"), path: PDF_TOOLS_HUB_PATH },
    { name: t("title"), path: PAGE_PATH },
  ];

  return (
    <>
      <JsonLd
        data={webApplicationLd({
          name: t("schemaName"),
          description: t("schemaDescription"),
          pathname,
          locale,
          featureList: [
            t("schemaFeatureLargeFiles"),
            t("schemaFeatureLocalSign"),
            t("schemaFeatureZeroUpload"),
            t("schemaFeaturePrivacy"),
          ],
          applicationCategory: "BusinessApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
          <h1 className="sr-only">{t("title")}</h1>
          <section className="border-b border-[#262626] pb-8" aria-label={t("title")}>
            <SignPdfWorkspace tool={tool} slug={WORKSPACE_SLUG} />
          </section>
        </div>
      </AppPageShell>
    </>
  );
}
