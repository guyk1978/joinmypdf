"use client";

import { useEffect, useState } from "react";

function readEmbedFlag(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

/** True when the current tool page is rendered inside ToolModal (?embed=1). */
export function useToolEmbedMode(): boolean {
  const [embed, setEmbed] = useState(readEmbedFlag);

  useEffect(() => {
    setEmbed(readEmbedFlag());
  }, []);

  return embed;
}
