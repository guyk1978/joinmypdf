export const OPEN_TOOLS_GRID_EVENT = "joinmypdf:open-tools-grid";

export function openToolsGrid() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_TOOLS_GRID_EVENT));
}
