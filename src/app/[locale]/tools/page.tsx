import type { Metadata } from "next";
export const runtime = "edge";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Lock, Shield } from "lucide-react";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteSearch } from "@/components/SiteSearch";
import { Link } from "@/i18n/navigation";
import { blogRegistry } from "@/lib/blog-registry";
import { translateToolItem, translateToolSection } from "@/lib/i18n-tool-labels";
import { buildMegaMenuSections } from "@/lib/mega-menu";
import { registry } from "@/lib/registry";
import { getToolDisplayLabel } from "@/lib/tool-labels";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

const FEATURED_SLUGS = [
  "pdf-merge",
  "pdf-compress",
  "jpg-to-pdf",
  "sign-pdf",
  "protect-pdf",
] as const;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ToolsDirectory" });

  return {
    title: t("title"),
    description: t("description", { count: registry.tools.length + 3 }),
    alternates: { canonical: `/${locale}/tools` },
    openGraph: {
      title: t("title"),
      description: t("description", { count: registry.tools.length + 3 }),
      url: absoluteUrl(`/${locale}/tools`),
    },
  };
}

export default async function ToolsDirectoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations("Tools");
  const tPage = await getTranslations("ToolsDirectory");
  const sections = buildMegaMenuSections();
  const toolCount = registry.tools.length + 3;

  const featuredItems = FEATURED_SLUGS.map((slug) => {
    const tool = registry.tools.find((t) => t.slug === slug);
    if (!tool) return null;
    return {
      href: `/tools/${tool.slug}/`,
      label: translateToolItem(tTools, tool.slug, getToolDisplayLabel(tool.slug, tool.title)),
      slugHint: tool.slug,
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tPage("title"),
          description: tPage("description", { count: toolCount }),
          url: absoluteUrl(`/${locale}/tools`),
          numberOfItems: toolCount,
        }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-4 md:py-14">
        <section className="rounded-none border border-neutral-300 bg-white px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900 md:px-8 md:py-10">
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700 dark:text-neutral-400 dark:text-black dark:text-neutral-300">
              {tPage("badge")}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-black dark:text-neutral-200 dark:text-white md:text-4xl lg:text-5xl">
              {tPage("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-800 dark:text-neutral-400 dark:text-slate-300 md:text-lg">
              {tPage("description", { count: toolCount })}
            </p>
            <div className="mx-auto mt-4 max-w-xl">
              <SiteSearch variant="hero" registry={registry} blog={blogRegistry} />
            </div>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-neutral-700 dark:text-neutral-400 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200" aria-hidden />
                {tPage("clientSide")}
              </span>
              <span className="hidden text-slate-300 sm:inline dark:text-black dark:text-neutral-300" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200" aria-hidden />
                <Link href="/privacy-first/" className="font-medium text-black dark:text-neutral-200 hover:underline dark:text-black dark:text-neutral-200">
                  {tPage("privacyFirst")}
                </Link>
              </span>
            </p>
          </div>
        </section>

        <section className="mt-12 space-y-4" aria-labelledby="featured-tools">
          <div>
            <h2 id="featured-tools" className="text-xl font-semibold text-black dark:text-neutral-200 dark:text-white md:text-2xl">
              {tPage("startHere")}
            </h2>
            <p className="mt-1 text-sm text-neutral-800 dark:text-neutral-400 dark:text-slate-400">{tPage("startHereDescription")}</p>
          </div>
          <CompactToolCardGrid items={featuredItems} />
        </section>

        {sections.map((section) => {
          const sectionLabel = translateToolSection(tTools, section.id, section.label);
          const countLabel =
            section.items.length === 1
              ? tPage("toolCount", { count: section.items.length })
              : tPage("toolCountPlural", { count: section.items.length });

          return (
            <section
              key={section.id}
              id={section.id}
              className="mt-14 scroll-mt-24 space-y-5 rounded-none border border-neutral-300 dark:border-neutral-800/70 bg-white/80 p-4 backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.03] md:p-4"
              aria-labelledby={`section-${section.id}`}
            >
              <div>
                <h2
                  id={`section-${section.id}`}
                  className="text-lg font-semibold text-black dark:text-neutral-200 dark:text-white md:text-xl"
                >
                  {sectionLabel}
                </h2>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-400 dark:text-slate-400">{countLabel}</p>
              </div>
              <CompactToolCardGrid
                items={section.items.map((item) => ({
                  href: item.href,
                  label: translateToolItem(tTools, item.slug, item.label),
                  slugHint: item.slug,
                }))}
              />
            </section>
          );
        })}

        <section className="mt-14 rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-900 dark:bg-neutral-200/50 px-4 py-4 text-center dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:bg-neutral-200/20 md:px-10">
          <h2 className="text-lg font-semibold text-black dark:text-neutral-200 dark:text-white">{tPage("whyLocalTitle")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-800 dark:text-neutral-400 dark:text-slate-300 md:text-base">
            {tPage("whyLocalBody")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/privacy-first/"
              className="inline-flex items-center justify-center rounded-none bg-neutral-900 dark:bg-neutral-200 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900 dark:bg-neutral-200 dark:bg-neutral-900 dark:bg-neutral-200 dark:hover:bg-neutral-900 dark:bg-neutral-200"
            >
              {tPage("learnPrivacy")}
            </Link>
            <Link
              href="/blog/"
              className="inline-flex items-center justify-center rounded-none border border-neutral-300 dark:border-neutral-800 bg-white px-5 py-2.5 text-sm font-semibold text-black dark:text-neutral-200 transition hover:bg-neutral-100 dark:bg-neutral-950 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {tPage("viewGuides")}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
