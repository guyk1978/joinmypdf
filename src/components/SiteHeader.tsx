import { SiteHeaderBar } from "@/components/SiteHeaderBar";

export function SiteHeader() {
  return (
    <header className="site-header site-header--matte fixed top-0 left-0 right-0 z-50 h-[var(--site-header-height,4.5rem)] w-full overflow-visible [--site-header-height:4.5rem]">
      <SiteHeaderBar />
    </header>
  );
}
