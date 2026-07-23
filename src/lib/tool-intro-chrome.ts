/** Cross-frame + same-window bridge for cinematic tool intro chrome. */
export const TOOL_INTRO_MESSAGE = "joinmypdf:tool-intro";

/**
 * Notify parent (ToolModal) that a cinematic fullscreen intro is active.
 * Parent sets `data-tool-intro="1"` so the site header is fully hidden and
 * the modal expands to true 100vh isolation until Get Started.
 */
export function setToolIntroActive(active: boolean) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(TOOL_INTRO_MESSAGE, { detail: { active } }),
  );

  if (window.parent !== window) {
    try {
      window.parent.postMessage({ type: TOOL_INTRO_MESSAGE, active }, "*");
    } catch {
      // Cross-origin parent — ignore.
    }
  }
}
