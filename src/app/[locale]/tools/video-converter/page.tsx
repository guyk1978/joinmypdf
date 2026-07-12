import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { ToolBreadcrumbs } from "@/components/layout/ToolBreadcrumbs";
import { buildToolPageBreadcrumbs } from "@/lib/tool-breadcrumb-hub";
import { RelatedTools } from "@/components/RelatedTools";
import { VideoConverterWorkspace } from "@/components/tools/VideoConverterWorkspace";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { registry } from "@/lib/registry";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";
import { notFound } from "next/navigation";

const SLUG = "video-converter";
const PAGE_PATH = `/tools/${SLUG}/`;

type PageProps = { params: Promise<{ locale: string }> };

const ARTICLE_SECTIONS = ["webFormats", "mp4Standard", "localConvert"] as const;

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
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="tool-page-layout__breadcrumbs">
            <ToolBreadcrumbs
              tool={{ slug: SLUG, title: t("title"), category: "convert" }}
              category="convert"
              items={breadcrumbItems}
            />
          </div>

          <header className="mb-6 border-b border-[#262626] pb-6">
            <h1 className="mb-4 text-3xl font-bold text-white">{t("title")}</h1>
            {t("description") !== t("title") ? (
              <p className="m-0 text-base leading-relaxed text-[#a3a3a3]">{t("description")}</p>
            ) : null}
          </header>

          <section className="border-b border-[#262626] pb-8" aria-label={t("title")}>
            <ToolPageShellProvider headline={t("title")} subline={t("description")} slug={SLUG}>
              <VideoConverterWorkspace tool={tool} slug={SLUG} />
            </ToolPageShellProvider>
          </section>

          <article
            className="border-b border-[#262626] py-10"
            aria-labelledby="video-converter-article"
          >
            <h2
              id="video-converter-article"
              className="mb-6 text-xl font-semibold tracking-tight text-white md:text-2xl"
            >
              {t("article.title")}
            </h2>
            <p className="mb-8 max-w-3xl text-base leading-relaxed text-[#a3a3a3]">
              {t("article.intro")}
            </p>

            {ARTICLE_SECTIONS.map((section) => {
              const paragraphs = [1, 2, 3, 4, 5, 6]
                .map((n) => `article.${section}.p${n}` as const)
                .filter((key) => t.has(key))
                .map((key) => t(key));

              return (
                <section
                  key={section}
                  className="mb-10 last:mb-0"
                  aria-labelledby={`video-converter-article-${section}`}
                >
                  <h3
                    id={`video-converter-article-${section}`}
                    className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
                  >
                    {t(`article.${section}.heading`)}
                  </h3>
                  {paragraphs.map((paragraph, index) => (
                    <p
                      key={`${section}-${index}`}
                      className="mb-4 max-w-3xl text-sm leading-relaxed text-[#a3a3a3] last:mb-0 md:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              );
            })}
          </article>

          <RelatedTools tool={tool} slug={SLUG} />

          <footer className="mt-8 flex flex-col gap-4 border-t border-[#262626] pt-6">
            <p className="m-0 text-xs uppercase tracking-widest text-[#737373]">{t("privacyBadge")}</p>
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
