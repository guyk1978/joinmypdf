import Link from "next/link";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import { SiteNav } from "@/components/SiteNav";
import { SiteSearch } from "@/components/SiteSearch";
import { blogRegistry } from "@/lib/blog-registry";
import { buildGuidesNavItems } from "@/lib/nav-config";
import { registry } from "@/lib/registry";

export function SiteHeader() {
  const guidesItems = buildGuidesNavItems(blogRegistry.blog);

  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Link href="/" className="brand site-header__brand">
          <HeaderPdfMini className="header-pdf-mini--tight" />
          <span className="brand__text">JoinMyPDF</span>
        </Link>
        <div className="site-header__cluster">
          <SiteSearch variant="header" registry={registry} blog={blogRegistry} />
          <SiteNav guidesItems={guidesItems} />
        </div>
      </div>
    </header>
  );
}
