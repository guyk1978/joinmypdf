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
    "inline-flex items-center gap-2 text-sm text-black dark:text-neutral-200 transition-colors hover:text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200 dark:hover:text-black dark:text-neutral-200";
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
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">
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
    <footer className="site-footer mt-8 border-t border-neutral-300 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="container mx-auto max-w-6xl px-2 py-6 md:px-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 text-black dark:text-neutral-200">
              <HeaderPdfMini className="header-pdf-mini--tight" />
              <span className="text-sm font-bold tracking-tight">{FOOTER_BRAND.name}</span>
            </Link>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-black dark:text-neutral-200">
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

        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-300 pt-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-black dark:text-neutral-200">
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
