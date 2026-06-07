"use client";

import { createContext, useContext, type ReactNode } from "react";

type ToolPageShellContextValue = {
  headline: string;
  subline: string;
};

const ToolPageShellContext = createContext<ToolPageShellContextValue>({
  headline: "",
  subline: "",
});

export function ToolPageShellProvider({
  headline,
  subline,
  children,
}: {
  headline: string;
  subline: string;
  children: ReactNode;
}) {
  return (
    <ToolPageShellContext.Provider value={{ headline, subline }}>{children}</ToolPageShellContext.Provider>
  );
}

export function useToolPageShell() {
  return useContext(ToolPageShellContext);
}
