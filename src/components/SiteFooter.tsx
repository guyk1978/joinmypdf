import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-surface py-12 text-sm text-ink-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:justify-between md:px-6">
        <div className="max-w-md space-y-2">
          <p className="font-semibold text-ink">JoinMyPDF</p>
          <p>
            Premium-feeling PDF utilities that run locally in your browser. Built for privacy, speed, and predictable
            downloads—without turning your homepage into a growth experiment.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
          <Link className="hover:text-brand" href="/privacy/">
            Privacy & security
          </Link>
          <Link className="hover:text-brand" href="/compare/">
            Comparisons
          </Link>
          <Link className="hover:text-brand" href="/privacy-first-pdf-tools/">
            Privacy-first PDF hub
          </Link>
          <Link className="hover:text-brand" href="/blog/">
            Guides
          </Link>
          <Link className="hover:text-brand" href="/tools/pdf-merge/">
            Merge PDF
          </Link>
          <Link className="hover:text-brand" href="/tools/pdf-compress/">
            Compress PDF
          </Link>
        </div>
      </div>
    </footer>
  );
}
