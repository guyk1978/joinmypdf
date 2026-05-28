import { SiteHeaderBar } from "@/components/SiteHeaderBar";
import { blogRegistry } from "@/lib/blog-registry";
import { buildMegaMenuSections } from "@/lib/mega-menu";
import { registry } from "@/lib/registry";

export function SiteHeader() {
  const megaMenuSections = buildMegaMenuSections();

  return (
    <header className="site-header overflow-visible">
      <SiteHeaderBar megaMenuSections={megaMenuSections} registry={registry} blog={blogRegistry} />
    </header>
  );
}
