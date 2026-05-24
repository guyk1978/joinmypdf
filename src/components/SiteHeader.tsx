import Link from "next/link";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import { SiteNav } from "@/components/SiteNav";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Link href="/" className="brand">
          JoinMyPDF
          <HeaderPdfMini className="header-pdf-mini--tight" />
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
