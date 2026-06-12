import { getTranslations } from "next-intl/server";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
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
  if (link.kind === "external") {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="site-footer__link">
        {label}
      </a>
    );
  }

  return (
    <Link href={link.href} className="site-footer__link" prefetch={false}>
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
    <div className="site-footer__column">
      <h3 className="site-footer__column-title">{title}</h3>
      <ul className="site-footer__link-list">
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
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Link href="/" className="site-footer__brand-link" aria-label={FOOTER_BRAND.name}>
              <JoinMyPdfLogo className="site-footer__logo" />
            </Link>
            <p className="site-footer__brand-desc">{brandDescription}</p>
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

        <div className="site-footer__bottom">
          <p className="site-footer__copyright">
            © {year} {FOOTER_BRAND.name}. {tFooter("copyright")}
          </p>
          <nav className="site-footer__partners" aria-label={tFooter("partnerNavLabel")}>
            {FOOTER_PARTNER_LINKS.map((link) => (
              <FooterLinkItem key={link.href} link={link} label={resolveLabel(link)} />
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
