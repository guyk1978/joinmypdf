import { SiteHeaderBar } from "@/components/SiteHeaderBar";
import { blogRegistry } from "@/lib/blog-registry";
import { buildMegaMenuSections } from "@/lib/mega-menu";
import { registry } from "@/lib/registry";

export function SiteHeader() {
  const megaMenuSections = buildMegaMenuSections();

  return (
    <header className="site-header fixed top-0 z-50 w-full overflow-visible border-b border-neutral-300 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <SiteHeaderBar megaMenuSections={megaMenuSections} registry={registry} blog={blogRegistry} />
    </header>
  );
}
