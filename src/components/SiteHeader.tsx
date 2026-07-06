import { SiteHeaderBar } from "@/components/SiteHeaderBar";

export function SiteHeader() {
  return (
    <header className="site-header site-header--matte z-[120] h-[var(--site-header-height,4.5rem)] w-full shrink-0 overflow-visible [--site-header-height:4.5rem]">
      <SiteHeaderBar />
    </header>
  );
}
