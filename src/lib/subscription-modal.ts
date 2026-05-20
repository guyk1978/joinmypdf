/** Dispatched after a PDF tool run finishes and download(s) have started. */
export const TOOL_COMPLETE_EVENT = "joinmypdf:tool-complete";

export type ToolCompleteDetail = {
  operation?: string;
  slug?: string;
};

/** Fires the legacy email-popup listener (assets/js/email-popup.js). */
export function dispatchToolComplete(detail: ToolCompleteDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOOL_COMPLETE_EVENT, { detail }));
}
