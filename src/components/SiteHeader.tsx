import { SiteHeaderBar } from "@/components/SiteHeaderBar";

export function SiteHeader() {
  return (
    <header className="site-header site-header--matte site-header--clean z-[120] w-full shrink-0 overflow-visible">
      <SiteHeaderBar />
    </header>
  );
}
