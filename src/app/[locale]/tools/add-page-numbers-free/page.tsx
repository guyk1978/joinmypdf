import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AddPageNumbersWorkspace } from "@/components/AddPageNumbersWorkspace";
import { AppPageShell } from "@/components/AppPageShell";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { PDF_TOOLS_HUB_PATH } from "@/lib/pdf-tools-hub";
import { registry } from "@/lib/registry";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

const SLUG = "add-page-numbers-free";
const WORKSPACE_SLUG = "add-page-numbers";
const PAGE_PATH = `/tools/${SLUG}/`;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AddPageNumbersFreePage" });

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

export default async function AddPageNumbersFreePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tool = registry.tools.find((entry) => entry.slug === WORKSPACE_SLUG);
  if (!tool) notFound();

  const t = await getTranslations("AddPageNumbersFreePage");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${PAGE_PATH}`;

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubPdf"), path: PDF_TOOLS_HUB_PATH },
    { name: t("title"), path: PAGE_PATH },
  ];

  const relatedTools = [
    { href: "/tools/add-page-numbers/", label: t("relatedAddPageNumbers") },
    { href: "/tools/pdf-merge/", label: t("relatedMergePdf") },
    { href: "/tools/pdf-split/", label: t("relatedSplitPdf") },
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
            t("schemaFeatureFree"),
            t("schemaFeatureNumbering"),
            t("schemaFeatureLocalProcess"),
            t("schemaFeatureZeroUpload"),
          ],
          applicationCategory: "BusinessApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page mx-auto w-full max-w-7xl px-4 md:px-6">
          <header className="mb-6 border-b border-[#262626] pb-6">
            <h1 className="mb-4 text-3xl font-bold text-white">{t("title")}</h1>
            <p className="m-0 text-base leading-relaxed text-[#a3a3a3]">{t("description")}</p>
          </header>

          <section className="border-b border-[#262626] pb-8" aria-label={t("title")}>
            <AddPageNumbersWorkspace tool={tool} slug={WORKSPACE_SLUG} />
          </section>

          <section
            className="border-b border-[#262626] py-8"
            aria-labelledby="add-page-numbers-free-related"
          >
            <h2
              id="add-page-numbers-free-related"
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

          <footer className="mt-8 flex flex-col gap-4 border-t border-[#262626] pt-6">
            <p className="m-0 text-xs uppercase tracking-widest text-[#737373]">{t("privacyNote")}</p>
            <Link
              href={PDF_TOOLS_HUB_PATH}
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("backToPdfTools")}
            </Link>
          </footer>
        </div>
      </AppPageShell>
    </>
  );
}
