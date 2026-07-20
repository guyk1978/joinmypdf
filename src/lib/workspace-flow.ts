export const WORKSPACE_UPLOAD_ID = "workspace-upload";
export const WORKSPACE_OPERATIONS_ID = "workspace-operations";

export type WorkspacePhase = "clean" | "active";

/**
 * Sync clean vs active upload UI across tool shells.
 * Sets `data-workspace-phase` on the workspace root(s) so CSS can drive
 * immersive dropzone sizing and control visibility.
 */
export function setWorkspacePhase(phase: WorkspacePhase, root?: HTMLElement | null) {
  if (typeof document === "undefined") return;

  const targets = new Set<HTMLElement>();
  if (root) targets.add(root);

  const toolWorkspace = document.getElementById("tool-workspace");
  if (toolWorkspace) targets.add(toolWorkspace);

  const uploadRoot = document.getElementById(WORKSPACE_UPLOAD_ID);
  if (uploadRoot) targets.add(uploadRoot);

  for (const el of targets) {
    el.dataset.workspacePhase = phase;
  }
}

export function getWorkspacePhaseFromSignal(fileSignal: boolean | number): WorkspacePhase {
  const hasFiles = typeof fileSignal === "number" ? fileSignal > 0 : Boolean(fileSignal);
  return hasFiles ? "active" : "clean";
}

export function scrollToWorkspaceOperations() {
  requestAnimationFrame(() => {
    document.getElementById(WORKSPACE_OPERATIONS_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function scrollToWorkspaceUpload() {
  requestAnimationFrame(() => {
    document.getElementById(WORKSPACE_UPLOAD_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}
