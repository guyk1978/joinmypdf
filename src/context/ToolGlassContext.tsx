"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { getToolGlassTheme, type ToolGlassCategory, type ToolGlassTheme } from "@/lib/tool-glass-theme";

const ToolGlassContext = createContext<ToolGlassTheme>(getToolGlassTheme("edit"));

export function ToolGlassProvider({
  category,
  children,
}: {
  category?: string | null;
  children: ReactNode;
}) {
  const theme = getToolGlassTheme(category);
  return (
    <ToolGlassContext.Provider value={theme}>
      <div
        data-tool-glass={theme.id}
        className="contents"
        style={{ "--tool-glow-rgb": theme.glowRgb } as CSSProperties}
      >
        {children}
      </div>
    </ToolGlassContext.Provider>
  );
}

export function useToolGlassTheme(): ToolGlassTheme {
  return useContext(ToolGlassContext);
}

export function useToolGlassCategory(): ToolGlassCategory {
  return useContext(ToolGlassContext).id;
}
