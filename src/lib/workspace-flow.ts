export const WORKSPACE_UPLOAD_ID = "workspace-upload";
export const WORKSPACE_OPERATIONS_ID = "workspace-operations";
export const WORKSPACE_PHASE_CLEAN_CLASS = "workspace-phase-clean";
/** Marks dedicated tool pages that use an immersive upload shell (hide body H1). */
export const TOOL_HAS_UPLOAD_SHELL_CLASS = "tool-has-upload-shell";

export type WorkspacePhase = "clean" | "active";

function applyDocumentPhaseClass(phase: WorkspacePhase) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(WORKSPACE_PHASE_CLEAN_CLASS, phase === "clean");
}

export function setToolHasUploadShell(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(TOOL_HAS_UPLOAD_SHELL_CLASS, enabled);
}

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
    if (el.dataset.workspacePhase !== phase) {
      el.dataset.workspacePhase = phase;
    }
  }

  applyDocumentPhaseClass(phase);
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
