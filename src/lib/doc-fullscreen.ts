/**
 * Cross-frame signal that a tool workspace is covering the viewport with a
 * CSS (or native) document-fullscreen layer — parent ToolModal must not treat
 * Escape as "close modal" while this is active.
 */
export const DOC_FULLSCREEN_MESSAGE = "joinmypdf:doc-fullscreen";

export function setDocFullscreenActive(active: boolean) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(DOC_FULLSCREEN_MESSAGE, { detail: { active } }));

  if (window.parent !== window) {
    try {
      window.parent.postMessage({ type: DOC_FULLSCREEN_MESSAGE, active }, "*");
    } catch {
      // Cross-origin parent — local Escape handling still applies in-frame.
    }
  }
}
