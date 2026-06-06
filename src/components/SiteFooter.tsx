import { getTranslations } from "next-intl/server";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import { Link } from "@/i18n/navigation";
import {
  FOOTER_BRAND,
  FOOTER_CATEGORIES_COLUMN,
  FOOTER_COMPANY_COLUMN,
  FOOTER_PARTNER_LINKS,
  FOOTER_PRODUCT_COLUMN,
  FOOTER_TAGLINE_KEYS,
  type FooterLinkDef,
} from "@/lib/footer-directory";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { registry } from "@/lib/registry";

type SiteFooterProps = {
  tagline?: keyof typeof FOOTER_TAGLINE_KEYS | string;
};

type FooterTranslator = Awaited<ReturnType<typeof getTranslations<"Footer">>>;
type ToolsTranslator = Awaited<ReturnType<typeof getTranslations<"Tools">>>;
type PartnersTranslator = Awaited<ReturnType<typeof getTranslations<"Partners">>>;

function resolveLinkLabel(
  link: FooterLinkDef,
  tFooter: FooterTranslator,
  tTools: ToolsTranslator,
  tPartners: PartnersTranslator,
): string {
  if (link.kind === "tool") {
    const tool = registry.tools.find((item) => item.slug === link.slug);
    return translateToolItem(tTools, link.slug, tool?.title ?? link.slug);
  }
  if (link.kind === "external") {
    return tPartners(link.labelKey as "mapDiagram" | "wattQuick");
  }
  return tFooter(`links.${link.labelKey}` as "links.home");
}

function FooterLinkItem({ link, label }: { link: FooterLinkDef; label: string }) {
  const className =
    "text-sm text-neutral-500 transition-colors hover:text-neutral-700 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200";

  if (link.kind === "external") {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className} prefetch={false}>
      {label}
    </Link>
  );
}

function FooterColumnBlock({
  title,
  links,
  resolveLabel,
}: {
  title: string;
  links: FooterLinkDef[];
  resolveLabel: (link: FooterLinkDef) => string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-200">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => {
          const label = resolveLabel(link);
          const key = link.kind === "tool" ? link.slug : `${link.href}-${link.labelKey}`;
          return (
            <li key={key}>
              <FooterLinkItem link={link} label={label} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export async function SiteFooter({ tagline }: SiteFooterProps) {
  const tFooter = await getTranslations("Footer");
  const tTools = await getTranslations("Tools");
  const tPartners = await getTranslations("Partners");

  const taglineKey =
    tagline && tagline in FOOTER_TAGLINE_KEYS
      ? FOOTER_TAGLINE_KEYS[tagline as keyof typeof FOOTER_TAGLINE_KEYS]
      : FOOTER_TAGLINE_KEYS.default;

  const brandDescription =
    taglineKey === FOOTER_TAGLINE_KEYS.default
      ? tFooter("brandDescription")
      : tFooter(`taglines.${taglineKey}` as "taglines.tools");

  const resolveLabel = (link: FooterLinkDef) =>
    resolveLinkLabel(link, tFooter, tTools, tPartners);

  const year = new Date().getFullYear();
  const footerColumns = [FOOTER_PRODUCT_COLUMN, FOOTER_CATEGORIES_COLUMN, FOOTER_COMPANY_COLUMN];

  return (
    <footer className="site-footer mt-8 border-t border-neutral-300 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 text-neutral-900 dark:text-neutral-200">
              <HeaderPdfMini className="header-pdf-mini--tight" />
              <span className="text-sm font-bold tracking-tight">{FOOTER_BRAND.name}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {brandDescription}
            </p>
          </div>

          {footerColumns.map((column) => (
            <FooterColumnBlock
              key={column.titleKey}
              title={tFooter(`columns.${column.titleKey}` as "columns.product")}
              links={column.links}
              resolveLabel={resolveLabel}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-neutral-300 pt-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            © {year} {FOOTER_BRAND.name}. {tFooter("copyright")}
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label={tFooter("partnerNavLabel")}>
            {FOOTER_PARTNER_LINKS.map((link) => (
              <FooterLinkItem key={link.href} link={link} label={resolveLabel(link)} />
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
