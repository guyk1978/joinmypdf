import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildUnitMathToolGridItems,
  getUnitMathToolFeatureLabels,
  UNIT_CONVERTERS_HUB_PATH,
} from "@/lib/unit-math-tools";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "UnitConvertersPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${UNIT_CONVERTERS_HUB_PATH}`,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${UNIT_CONVERTERS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function UnitConvertersHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("UnitConvertersPage");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${UNIT_CONVERTERS_HUB_PATH}`;
  const gridItems = buildUnitMathToolGridItems(t);
  const featureList = getUnitMathToolFeatureLabels(t);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: t("title"), path: UNIT_CONVERTERS_HUB_PATH },
  ];

  return (
    <>
      <JsonLd
        data={webApplicationLd({
          name: t("schemaName"),
          description: t("schemaDescription"),
          pathname,
          locale,
          featureList,
          applicationCategory: "UtilitiesApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page mx-auto w-full max-w-7xl px-4 md:px-6">
          <header className="mb-6 border-b border-[#262626] pb-6">
            <h1 className="mb-6 text-4xl font-bold text-white">{t("title")}</h1>
            <p className="m-0 text-base leading-relaxed text-[#a3a3a3]">{t("description")}</p>
          </header>

          <section className="tools-hub-panel border-b border-[#262626] pb-8" aria-label={t("schemaName")}>
            <CategoryDirectoryFlatGrid items={gridItems} categoryId="unit-math" />
          </section>

          <article className="border-b border-[#262626] py-10" aria-labelledby="unit-converters-intro">
            <h2
              id="unit-converters-intro"
              className="mb-4 text-xl font-semibold tracking-tight text-white md:text-2xl"
            >
              {t("introHeading")}
            </h2>
            <p className="mb-4 max-w-3xl text-base leading-relaxed text-[#a3a3a3]">{t("introP1")}</p>
            <p className="m-0 max-w-3xl text-base leading-relaxed text-[#a3a3a3]">{t("introP2")}</p>
          </article>

          <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#262626] pt-6">
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("backToHome")}
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
