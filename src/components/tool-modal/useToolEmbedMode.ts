"use client";

import { useEffect, useState } from "react";

/** True when the current tool page is rendered inside ToolModal (?embed=1). */
export function useToolEmbedMode(): boolean {
  const [embed, setEmbed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmbed(params.get("embed") === "1");
  }, []);

  return embed;
}
