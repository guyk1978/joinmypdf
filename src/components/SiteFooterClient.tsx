"use client";

import { clsx } from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { Link } from "@/i18n/navigation";
import { getBrandName } from "@/lib/brand";

export type FooterLinkItem = {
  href: string;
  label: string;
  external?: boolean;
};

export type FooterColumnData = {
  title: string;
  links: FooterLinkItem[];
};

type SiteFooterClientProps = {
  brandDescription: string;
  columns: FooterColumnData[];
  copyrightText: string;
  partnerLinks: FooterLinkItem[];
  partnerNavLabel: string;
};

function FooterLink({ link }: { link: FooterLinkItem }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="site-footer__link">
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className="site-footer__link" prefetch={false}>
      {link.label}
    </Link>
  );
}

function FooterColumnBlock({ title, links }: FooterColumnData) {
  return (
    <div className="site-footer__column">
      <h3 className="site-footer__column-title">{title}</h3>
      <ul className="site-footer__link-list">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <FooterLink link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooterClient({
  brandDescription,
  columns,
  copyrightText,
  partnerLinks,
  partnerNavLabel,
}: SiteFooterClientProps) {
  const locale = useLocale();
  const tFooter = useTranslations("Footer");
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <footer className={clsx("site-footer", open && "site-footer--expanded")}>
      <div className="site-footer__inner">
        <div
          id={panelId}
          className={clsx("site-footer__expandable", open && "site-footer__expandable--open")}
          aria-hidden={!open}
          inert={!open ? true : undefined}
        >
          <div className="site-footer__expandable-inner">
            <div className="site-footer__grid">
              <div className="site-footer__brand">
                <Link href="/" className="site-footer__brand-link" aria-label={getBrandName(locale)}>
                  <JoinMyPdfLogo className="site-footer__logo" />
                </Link>
                <p className="site-footer__brand-desc">{brandDescription}</p>
              </div>

              {columns.map((column) => (
                <FooterColumnBlock key={column.title} {...column} />
              ))}
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <button
            type="button"
            className="site-footer__toggle"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="site-footer__toggle-icon" aria-hidden="true">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
            <span>{open ? tFooter("collapseFooter") : tFooter("expandFooter")}</span>
          </button>

          <p className="site-footer__copyright">{copyrightText}</p>

          <nav className="site-footer__partners" aria-label={partnerNavLabel}>
            {partnerLinks.map((link) => (
              <FooterLink key={link.href} link={link} />
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
