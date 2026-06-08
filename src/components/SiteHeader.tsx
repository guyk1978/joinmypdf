import { SiteHeaderBar } from "@/components/SiteHeaderBar";
import { blogRegistry } from "@/lib/blog-registry";
import { buildMegaMenuSections } from "@/lib/mega-menu";
import { registry } from "@/lib/registry";

export function SiteHeader() {
  const megaMenuSections = buildMegaMenuSections();

  return (
    <header className="site-header fixed top-0 left-0 right-0 z-50 h-12 w-full overflow-visible border-b border-neutral-300 bg-neutral-50 shadow-sm transition-colors duration-500 ease-in-out dark:border-neutral-800 dark:bg-neutral-900 [--site-header-height:3rem]">
      <SiteHeaderBar megaMenuSections={megaMenuSections} registry={registry} blog={blogRegistry} />
    </header>
  );
}
