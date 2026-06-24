import { SiteHeaderBar } from "@/components/SiteHeaderBar";
import { blogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";

export function SiteHeader() {
  return (
    <header className="site-header site-header--matte fixed top-0 left-0 right-0 z-50 h-[var(--site-header-height,4rem)] w-full overflow-visible [--site-header-height:4rem]">
      <SiteHeaderBar registry={registry} blog={blogRegistry} />
    </header>
  );
}
