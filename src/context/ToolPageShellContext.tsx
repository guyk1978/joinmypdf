"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { ToolFeedbackProvider } from "@/context/ToolFeedbackContext";
import { recordRecentWorkspace, recordToolUsage } from "@/lib/recent-activity";

type ToolPageShellContextValue = {
  headline: string;
  subline: string;
  tagline?: string;
  stacked: boolean;
  slug: string;
};

const ToolPageShellContext = createContext<ToolPageShellContextValue>({
  headline: "",
  subline: "",
  tagline: undefined,
  stacked: false,
  slug: "",
});

/**
 * Feeds the homepage personalization sections: counts a usage per tool
 * visit (and updates the chronological Recent Tools list), and captures
 * the name of any file the user loads (file input or drag-and-drop)
 * anywhere inside the tool page. Workspaces own their files, so
 * document-level capture listeners are the one place that sees every
 * upload without touching each workspace.
 */
function useToolActivityTracking(slug: string) {
  useEffect(() => {
    if (!slug) return;
    recordToolUsage(slug);

    const onChange = (event: Event) => {
      const input = event.target as HTMLInputElement | null;
      if (!input || input.type !== "file") return;
      const file = input.files?.[0];
      if (file) recordRecentWorkspace(slug, file.name);
    };
    const onDrop = (event: DragEvent) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) recordRecentWorkspace(slug, file.name);
    };

    document.addEventListener("change", onChange, true);
    document.addEventListener("drop", onDrop, true);
    return () => {
      document.removeEventListener("change", onChange, true);
      document.removeEventListener("drop", onDrop, true);
    };
  }, [slug]);
}

export function ToolPageShellProvider({
  headline,
  subline,
  tagline,
  slug = "",
  stacked = false,
  children,
}: {
  headline: string;
  subline: string;
  tagline?: string;
  slug?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  useToolActivityTracking(slug);

  return (
    <ToolFeedbackProvider>
      <ToolPageShellContext.Provider value={{ headline, subline, tagline, stacked, slug }}>
        {children}
      </ToolPageShellContext.Provider>
    </ToolFeedbackProvider>
  );
}

export function useToolPageShell() {
  return useContext(ToolPageShellContext);
}
