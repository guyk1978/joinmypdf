"use client";

import { useEffect, useState } from "react";
import { TOOL_INTRO_MESSAGE } from "@/lib/tool-intro-chrome";

/** Every cinematic tool landing portals a `.tool-intro-fs` root onto the body. */
const SPLASH_SELECTOR = ".tool-intro-fs";

/**
 * True while a cinematic tool landing splash is on screen.
 *
 * Gates dispatch TOOL_INTRO_MESSAGE from a layout effect, which can fire before
 * an ancestor subscribes, so DOM presence is the source of truth and the event
 * only nudges a re-check.
 */
export function useToolIntroSplashActive(): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(Boolean(document.querySelector(SPLASH_SELECTOR)));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true });
    window.addEventListener(TOOL_INTRO_MESSAGE, sync);

    return () => {
      observer.disconnect();
      window.removeEventListener(TOOL_INTRO_MESSAGE, sync);
    };
  }, []);

  return active;
}
