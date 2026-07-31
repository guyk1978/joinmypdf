import { SiteHeaderBar } from "@/components/SiteHeaderBar";

/** Global site header — solid, sticky, constant height (no scroll shrink). */
export function SiteHeader() {
  return (
    <header className="site-header site-header--matte site-header--clean z-[120] w-full shrink-0">
      <div className="site-header__visual">
        <SiteHeaderBar />
      </div>
    </header>
  );
}
