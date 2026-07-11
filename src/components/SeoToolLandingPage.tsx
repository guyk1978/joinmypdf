import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AddPageNumbersWorkspace } from "@/components/AddPageNumbersWorkspace";
import { AppPageShell } from "@/components/AppPageShell";
import { DeletePdfPagesWorkspace } from "@/components/DeletePdfPagesWorkspace";
import { PdfToPngWorkspace } from "@/components/PdfToPngWorkspace";
import { ProtectPdfWorkspace } from "@/components/ProtectPdfWorkspace";
import { SignPdfWorkspace } from "@/components/SignPdfWorkspace";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { Link } from "@/i18n/navigation";
import {
  getSeoToolLanding,
  seoToolLandingPath,
  type SeoLandingWorkspaceSlug,
  type SeoToolLandingSlug,
} from "@/lib/seo-tool-landings";
import { PDF_TOOLS_HUB_PATH } from "@/lib/pdf-tools-hub";
import { registry } from "@/lib/registry";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";
import type { ToolDefinition } from "@/lib/types";

type SeoToolLandingPageProps = {
  slug: SeoToolLandingSlug;
  params: Promise<{ locale: string }>;
};

function renderWorkspace(workspaceSlug: SeoLandingWorkspaceSlug, tool: ToolDefinition) {
  switch (workspaceSlug) {
    case "pdf-to-png":
      return <PdfToPngWorkspace tool={tool} slug={workspaceSlug} />;
    case "add-page-numbers":
      return <AddPageNumbersWorkspace tool={tool} slug={workspaceSlug} />;
    case "sign-pdf":
      return <SignPdfWorkspace tool={tool} slug={workspaceSlug} />;
    case "protect-pdf":
      return <ProtectPdfWorkspace tool={tool} slug={workspaceSlug} />;
    case "delete-pdf-pages":
      return <DeletePdfPagesWorkspace tool={tool} slug={workspaceSlug} />;
    case "png-to-pdf":
    default:
      return <ToolWorkspace tool={tool} slug={workspaceSlug} />;
  }
}

export async function SeoToolLandingPage({ slug, params }: SeoToolLandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const landing = getSeoToolLanding(slug);
  if (!landing) notFound();

  const tool = registry.tools.find((entry) => entry.slug === landing.workspaceSlug);
  if (!tool) notFound();

  const t = await getTranslations("SeoToolLandings");
  const tPage = await getTranslations("ToolPage");
  const pagePath = seoToolLandingPath(slug);
  const pathname = `/${locale}${pagePath}`;

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubPdf"), path: PDF_TOOLS_HUB_PATH },
    { name: t(`${slug}.title`), path: pagePath },
  ];

  return (
    <>
      <JsonLd
        data={webApplicationLd({
          name: t(`${slug}.schemaName`),
          description: t(`${slug}.schemaDescription`),
          pathname,
          locale,
          featureList: [
            t(`${slug}.schemaFeaturePrimary`),
            t("shared.schemaFeatureLocal"),
            t("shared.schemaFeatureZeroUpload"),
            t("shared.schemaFeaturePrivacy"),
          ],
          applicationCategory: "BusinessApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page mx-auto w-full max-w-7xl px-4 md:px-6">
          <header className="mb-6 border-b border-[#262626] pb-6">
            <h1 className="mb-4 text-3xl font-bold text-white">{t(`${slug}.title`)}</h1>
            <p className="m-0 text-base leading-relaxed text-[#a3a3a3]">{t(`${slug}.description`)}</p>
          </header>

          <section className="border-b border-[#262626] pb-8" aria-label={t(`${slug}.title`)}>
            {renderWorkspace(landing.workspaceSlug, tool)}
          </section>

          <section
            className="border-b border-[#262626] py-8"
            aria-labelledby={`${slug}-related`}
          >
            <h2
              id={`${slug}-related`}
              className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
            >
              {t("shared.relatedToolsTitle")}
            </h2>
            <ul className="flex flex-col gap-3">
              {landing.related.map((item) => (
                <li key={item.href} className="border-b border-[#1a1a1a] pb-3 last:border-b-0 last:pb-0">
                  <Link
                    href={item.href}
                    className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                    prefetch={false}
                  >
                    {t(`shared.related.${item.labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-8 flex flex-col gap-4 border-t border-[#262626] pt-6">
            <p className="m-0 text-xs uppercase tracking-widest text-[#737373]">
              {t("shared.privacyNote")}
            </p>
            <Link
              href={PDF_TOOLS_HUB_PATH}
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("shared.backToPdfTools")}
            </Link>
          </footer>
        </div>
      </AppPageShell>
    </>
  );
}
