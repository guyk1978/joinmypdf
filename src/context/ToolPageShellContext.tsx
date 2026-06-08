"use client";

import { createContext, useContext, type ReactNode } from "react";

type ToolPageShellContextValue = {
  headline: string;
  subline: string;
  stacked: boolean;
};

const ToolPageShellContext = createContext<ToolPageShellContextValue>({
  headline: "",
  subline: "",
  stacked: false,
});

export function ToolPageShellProvider({
  headline,
  subline,
  stacked = false,
  children,
}: {
  headline: string;
  subline: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <ToolPageShellContext.Provider value={{ headline, subline, stacked }}>
      {children}
    </ToolPageShellContext.Provider>
  );
}

export function useToolPageShell() {
  return useContext(ToolPageShellContext);
}
