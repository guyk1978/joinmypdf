import { getTranslations } from "next-intl/server";
import { SiteFooterClient } from "@/components/SiteFooterClient";
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
    <SiteFooterClient
      brandDescription={brandDescription}
      columns={footerColumns.map((column) => ({
        title: tFooter(`columns.${column.titleKey}` as "columns.product"),
        links: column.links.map((link) => ({
          href: link.href,
          label: resolveLabel(link),
          external: link.kind === "external",
        })),
      }))}
      copyrightText={`© ${year} ${FOOTER_BRAND.name}. ${tFooter("copyright")}`}
      partnerLinks={FOOTER_PARTNER_LINKS.map((link) => ({
        href: link.href,
        label: resolveLabel(link),
        external: true,
      }))}
      partnerNavLabel={tFooter("partnerNavLabel")}
    />
  );
}
