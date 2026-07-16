"use client";

import { usePathname } from "@/i18n/navigation";
import { CategoryHubsSection } from "@/components/CategoryHubsSection";

/**
 * Sitewide inventory hubs strip. Hidden on the homepage (categories live
 * in the main dashboard there to avoid duplication).
 */
export function FooterToolsPanel() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";

  if (isHome) return null;

  return (
    <div className="footer-tools-panel">
      <div className="footer-tools-panel__shell">
        <CategoryHubsSection />
      </div>
    </div>
  );
}
