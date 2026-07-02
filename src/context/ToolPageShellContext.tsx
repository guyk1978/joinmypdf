"use client";

import { createContext, useContext, type ReactNode } from "react";

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
  return (
    <ToolPageShellContext.Provider value={{ headline, subline, tagline, stacked, slug }}>
      {children}
    </ToolPageShellContext.Provider>
  );
}

export function useToolPageShell() {
  return useContext(ToolPageShellContext);
}
