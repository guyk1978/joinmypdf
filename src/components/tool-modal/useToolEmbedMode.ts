"use client";

import { useSearchParams } from "next/navigation";

/** True when the current tool page is rendered inside ToolModal (?embed=1). */
export function useToolEmbedMode(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("embed") === "1";
}
