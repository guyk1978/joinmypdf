import Link from "next/link";
import { FOOTER_DIRECTORY_COLUMNS, FOOTER_TAGLINES } from "@/lib/footer-directory";

type SiteFooterProps = {
  tagline?: keyof typeof FOOTER_TAGLINES | string;
};

export function SiteFooter({ tagline = "default" }: SiteFooterProps) {
  const taglineText =
    tagline in FOOTER_TAGLINES ? FOOTER_TAGLINES[tagline as keyof typeof FOOTER_TAGLINES] : tagline;

  return (
    <footer className="site-footer">
      <div className="container">
        <p className="site-footer__tagline">{taglineText}</p>
        <nav className="site-footer__directory" aria-label="Site directory">
          {FOOTER_DIRECTORY_COLUMNS.map((column) => (
            <div
              key={column.title}
              className={
                column.partners ? "site-footer__col site-footer__col--partners" : "site-footer__col"
              }
            >
              <strong>{column.title}</strong>
              {column.links.map((link) =>
                link.external ? (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
