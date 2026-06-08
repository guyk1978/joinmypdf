"use client";

import { createContext, useContext, type ReactNode } from "react";

type ToolPageShellContextValue = {
  headline: string;
  subline: string;
  stacked: boolean;
  slug: string;
};

const ToolPageShellContext = createContext<ToolPageShellContextValue>({
  headline: "",
  subline: "",
  stacked: false,
  slug: "",
});

export function ToolPageShellProvider({
  headline,
  subline,
  slug = "",
  stacked = false,
  children,
}: {
  headline: string;
  subline: string;
  slug?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <ToolPageShellContext.Provider value={{ headline, subline, stacked, slug }}>
      {children}
    </ToolPageShellContext.Provider>
  );
}

export function useToolPageShell() {
  return useContext(ToolPageShellContext);
}
