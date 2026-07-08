import { Link } from "@/i18n/navigation";

type CategoryDirectoryFooterProps = {
  backToHomeLabel: string;
  browseAllToolsLabel: string;
  footerNavLabel: string;
};

export function CategoryDirectoryFooter({
  backToHomeLabel,
  browseAllToolsLabel,
  footerNavLabel,
}: CategoryDirectoryFooterProps) {
  return (
    <nav className="tools-directory-footer" aria-label={footerNavLabel}>
      <Link href="/" className="tools-directory-footer__link" prefetch={false}>
        {backToHomeLabel}
      </Link>
      <Link href="/tools" className="tools-directory-footer__link" prefetch={false}>
        {browseAllToolsLabel}
      </Link>
    </nav>
  );
}
