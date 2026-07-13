"use client";

import { CategoryHubsSection } from "@/components/CategoryHubsSection";

/**
 * Sitewide inventory hubs strip (names only). Same component on every page,
 * including the homepage.
 */
export function FooterToolsPanel() {
  return (
    <div className="footer-tools-panel">
      <div className="footer-tools-panel__shell">
        <CategoryHubsSection />
      </div>
    </div>
  );
}
