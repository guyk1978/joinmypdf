import Link from "next/link";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import { SiteNav } from "@/components/SiteNav";
import { blogRegistry } from "@/lib/blog-registry";
import { buildGuidesNavItems } from "@/lib/nav-config";

export function SiteHeader() {
  const guidesItems = buildGuidesNavItems(blogRegistry.blog);

  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Link href="/" className="brand">
          <HeaderPdfMini className="header-pdf-mini--tight" />
          <span className="brand__text">JoinMyPDF</span>
        </Link>
        <SiteNav guidesItems={guidesItems} />
      </div>
    </header>
  );
}
