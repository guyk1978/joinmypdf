import Link from "next/link";

const links = [
  { href: "/tools/pdf-merge/", label: "Merge" },
  { href: "/tools/pdf-compress/", label: "Compress" },
  { href: "/tools/pdf-split/", label: "Split" },
  { href: "/tools/jpg-to-pdf/", label: "JPG → PDF" },
  { href: "/tools/pdf-to-jpg/", label: "PDF → JPG" },
  { href: "/blog/", label: "Guides" },
  { href: "/privacy/", label: "Privacy" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink">
          JoinMyPDF
        </Link>
        <nav
          aria-label="Primary"
          className="flex max-w-[72vw] gap-3 overflow-x-auto whitespace-nowrap text-sm md:max-w-none md:flex-wrap md:justify-end md:gap-4"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              className="text-ink-muted transition hover:text-brand"
              href={l.href}
              prefetch={false}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
