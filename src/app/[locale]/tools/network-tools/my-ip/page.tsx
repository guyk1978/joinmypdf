import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { RelatedTools } from "@/components/RelatedTools";
import { MyIpNetworkInfoWorkspace } from "@/components/tools/network/MyIpNetworkInfoWorkspace";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getLocalizedToolFaqs } from "@/lib/i18n-tool-page";
import { MY_IP_TOOL_PATH, MY_IP_TOOL_SLUG, NETWORK_TOOLS_HUB_PATH } from "@/lib/network-tools-hub";
import { registry } from "@/lib/registry";
import { breadcrumbLd, faqLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { buildToolPageBreadcrumbs } from "@/lib/tool-breadcrumb-hub";
import { productPageMainClassName } from "@/lib/tool-ui";
import { notFound } from "next/navigation";

const SLUG = MY_IP_TOOL_SLUG;
const PAGE_PATH = MY_IP_TOOL_PATH;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MyIpNetworkInfoPage" });

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

export default async function MyIpNetworkInfoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tool = registry.tools.find((entry) => entry.slug === SLUG);
  if (!tool) notFound();

  const t = await getTranslations("MyIpNetworkInfoPage");
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
            t("schemaFeatureIp"),
            t("schemaFeatureGeo"),
            t("schemaFeatureSystem"),
            t("schemaFeaturePrivacy"),
          ],
          applicationCategory: "DeveloperApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      {faqs.length ? <JsonLd data={faqLd(faqs)} /> : null}

      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
          <section className="border-b border-[#262626] pb-8" aria-label={t("title")}>
            <h1 className="sr-only">{t("title")}</h1>
            <MyIpNetworkInfoWorkspace tool={tool} slug={SLUG} />
          </section>

          <div className="border-b border-[#262626] py-10">
            <RelatedTools tool={tool} slug={SLUG} />
          </div>

          <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#262626] pt-6">
            <Link
              href={NETWORK_TOOLS_HUB_PATH}
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("backToHub")}
            </Link>
            <Link
              href="/tools/"
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("backToAllTools")}
            </Link>
          </footer>
        </div>
      </AppPageShell>
    </>
  );
}
