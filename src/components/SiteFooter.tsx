import Link from "next/link";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import {
  FOOTER_BRAND,
  FOOTER_COMPANY_COLUMN,
  FOOTER_PARTNER_LINKS,
  FOOTER_TAGLINES,
  FOOTER_TOOL_COLUMNS,
  type FooterLink,
} from "@/lib/footer-directory";
import { ToolIconBadge } from "@/lib/tool-icons";

type SiteFooterProps = {
  tagline?: keyof typeof FOOTER_TAGLINES | string;
};

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400";

  const content = (
    <>
      {link.slug ? <ToolIconBadge slug={link.slug} label={link.label} size="sm" /> : null}
      <span>{link.label}</span>
    </>
  );

  if (link.external) {
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

function FooterColumnBlock({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ tagline }: SiteFooterProps) {
  const brandDescription =
    tagline && tagline in FOOTER_TAGLINES
      ? FOOTER_TAGLINES[tagline as keyof typeof FOOTER_TAGLINES]
      : tagline || FOOTER_BRAND.description;

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
            <FooterColumnBlock key={column.title} title={column.title} links={column.links} />
          ))}

          <FooterColumnBlock title={FOOTER_COMPANY_COLUMN.title} links={FOOTER_COMPANY_COLUMN.links} />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            © {year} {FOOTER_BRAND.name}. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Partner tools">
            {FOOTER_PARTNER_LINKS.map((link) => (
              <FooterLinkItem key={link.href} link={link} />
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
