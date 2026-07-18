import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryShell } from "@/components/CategoryDirectoryShell";
import { Link } from "@/i18n/navigation";
import { getCategoryDirectoryItemCount, getCategoryDirectoryPageProps } from "@/lib/category-directory-config";
import { JsonLd, breadcrumbLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

const HUB_PATH = "/tools/image-tools/";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("imageToolsDirectoryTitle"),
    description: t("imageToolsDirectoryDescription"),
    alternates: { canonical: `/${locale}${HUB_PATH}` },
  };
}

export default async function ImageToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const tCategory = await getTranslations("CategoryDirectory");
  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");
  const page = getCategoryDirectoryPageProps("image", tHome, tCategory, locale, tTools);
  const itemCount = getCategoryDirectoryItemCount("image", tHome);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubImage"), path: HUB_PATH },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: page.title,
          description: page.description,
          url: absoluteUrl(`/${locale}${HUB_PATH}`),
          numberOfItems: itemCount,
        }}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell>
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <nav aria-label="Breadcrumb" className="tool-breadcrumbs mb-6">
            <ol className="tool-breadcrumbs__list">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <li key={`${crumb.path}-${index}`} className="tool-breadcrumbs__item">
                    {isLast ? (
                      <span className="tool-breadcrumbs__current" aria-current="page">
                        {crumb.name}
                      </span>
                    ) : (
                      <>
                        <Link href={crumb.path} className="tool-breadcrumbs__link" prefetch={false}>
                          {crumb.name}
                        </Link>
                        <span className="tool-breadcrumbs__sep" aria-hidden="true">
                          /
                        </span>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <CategoryDirectoryShell {...page} />
        </div>
      </AppPageShell>
    </>
  );
}
