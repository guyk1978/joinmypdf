import { SiteHeaderBar } from "@/components/SiteHeaderBar";

export function SiteHeader() {
  return (
    <header className="site-header site-header--matte site-header--black-utility z-[120] h-24 w-full shrink-0 overflow-visible bg-black [--site-header-height:6rem]">
      <SiteHeaderBar />
    </header>
  );
}
