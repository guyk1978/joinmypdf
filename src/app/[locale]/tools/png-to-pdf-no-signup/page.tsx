import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { PDF_TOOLS_HUB_PATH } from "@/lib/pdf-tools-hub";
import { registry } from "@/lib/registry";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

const SLUG = "png-to-pdf-no-signup";
const WORKSPACE_SLUG = "png-to-pdf";
const PAGE_PATH = `/tools/${SLUG}/`;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PngToPdfNoSignupPage" });

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

export default async function PngToPdfNoSignupPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tool = registry.tools.find((entry) => entry.slug === WORKSPACE_SLUG);
  if (!tool) notFound();

  const t = await getTranslations("PngToPdfNoSignupPage");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${PAGE_PATH}`;

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubPdf"), path: PDF_TOOLS_HUB_PATH },
    { name: t("title"), path: PAGE_PATH },
  ];

  const relatedTools = [
    { href: "/tools/jpg-to-pdf/", label: t("relatedJpgToPdf") },
    { href: "/tools/pdf-to-png/", label: t("relatedPdfToPng") },
    { href: "/tools/pdf-merge/", label: t("relatedMergePdf") },
  ] as const;

  return (
    <>
      <JsonLd
        data={webApplicationLd({
          name: t("schemaName"),
          description: t("schemaDescription"),
          pathname,
          locale,
          featureList: [
            t("schemaFeatureNoSignup"),
            t("schemaFeatureLocalConvert"),
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
            <ToolWorkspace tool={tool} slug={WORKSPACE_SLUG} />
          </section>

          <section
            className="border-b border-[#262626] py-8"
            aria-labelledby="png-to-pdf-no-signup-related"
          >
            <h2
              id="png-to-pdf-no-signup-related"
              className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
            >
              {t("relatedToolsTitle")}
            </h2>
            <ul className="flex flex-col gap-3">
              {relatedTools.map((item) => (
                <li key={item.href} className="border-b border-[#1a1a1a] pb-3 last:border-b-0 last:pb-0">
                  <Link
                    href={item.href}
                    className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                    prefetch={false}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
</div>
      </AppPageShell>
    </>
  );
}
