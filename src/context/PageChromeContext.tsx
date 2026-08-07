"use client";

import { createContext, useContext, type ReactNode } from "react";

/** True when an ancestor already rendered global site chrome (header/footer shell). */
const PageChromeContext = createContext(false);

export function PageChromeActiveProvider({ children }: { children: ReactNode }) {
  return <PageChromeContext.Provider value={true}>{children}</PageChromeContext.Provider>;
}

export function usePageChromeActive(): boolean {
  return useContext(PageChromeContext);
}
