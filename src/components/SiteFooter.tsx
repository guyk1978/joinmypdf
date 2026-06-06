import { getTranslations } from "next-intl/server";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import { Link } from "@/i18n/navigation";
import {
  FOOTER_BRAND,
  FOOTER_COMPANY_COLUMN,
  FOOTER_PARTNER_LINKS,
  FOOTER_TAGLINE_KEYS,
  FOOTER_TOOL_COLUMNS,
  type FooterLinkDef,
} from "@/lib/footer-directory";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { registry } from "@/lib/registry";
import { ToolIconBadge } from "@/lib/tool-icons";

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

function FooterLinkItem({
  link,
  label,
}: {
  link: FooterLinkDef;
  label: string;
}) {
  const className =
    "inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400";
  const slug = link.kind === "tool" ? link.slug : undefined;

  const content = (
    <>
      {slug ? <ToolIconBadge slug={slug} label={label} size="sm" /> : null}
      <span>{label}</span>
    </>
  );

  if (link.kind === "external") {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className} prefetch={false}>
      {content}
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
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
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

  return (
    <footer className="site-footer mt-16 border-t border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-900 dark:text-white">
              <HeaderPdfMini className="header-pdf-mini--tight" />
              <span className="text-base font-bold tracking-tight">{FOOTER_BRAND.name}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {brandDescription}
            </p>
          </div>

          {FOOTER_TOOL_COLUMNS.map((column) => (
            <FooterColumnBlock
              key={column.titleKey}
              title={tFooter(`columns.${column.titleKey}` as "columns.convertToPdf")}
              links={column.links}
              resolveLabel={resolveLabel}
            />
          ))}

          <FooterColumnBlock
            title={tFooter(`columns.${FOOTER_COMPANY_COLUMN.titleKey}` as "columns.company")}
            links={FOOTER_COMPANY_COLUMN.links}
            resolveLabel={resolveLabel}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-500">
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
