export const WORKSPACE_UPLOAD_ID = "workspace-upload";
export const WORKSPACE_OPERATIONS_ID = "workspace-operations";
export const WORKSPACE_PHASE_CLEAN_CLASS = "workspace-phase-clean";
/** Marks dedicated tool pages that use an immersive upload shell (hide body H1). */
export const TOOL_HAS_UPLOAD_SHELL_CLASS = "tool-has-upload-shell";
/**
 * Tool pages with Overview / FAQ under the workspace — use the browser
 * document scrollbar only (no nested 100dvh overflow lock).
 */
export const TOOL_PAGE_DOCUMENT_SCROLL_CLASS = "tool-page-document-scroll";
/** Cross-frame + same-window bridge for tool-modal header chrome. */
export const WORKSPACE_PHASE_MESSAGE = "joinmypdf:workspace-phase";
/** Embed → parent: switch tool modal to a tab (e.g. reviews from banner rating). */
export const WORKSPACE_SET_TAB_MESSAGE = "joinmypdf:workspace-set-tab";
/** Same-window custom event for full-page ToolPageViewShell tab switches. */
export const WORKSPACE_SET_TAB_EVENT = "joinmypdf:workspace-set-tab";

export type WorkspacePhase = "clean" | "active";

function applyDocumentPhaseClass(phase: WorkspacePhase) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(WORKSPACE_PHASE_CLEAN_CLASS, phase === "clean");
}

function broadcastWorkspacePhase(phase: WorkspacePhase) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(WORKSPACE_PHASE_MESSAGE, { detail: { phase } }),
  );

  if (window.parent !== window) {
    try {
      window.parent.postMessage({ type: WORKSPACE_PHASE_MESSAGE, phase }, "*");
    } catch {
      // Cross-origin parent — ignore.
    }
  }
}

export function setToolHasUploadShell(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(TOOL_HAS_UPLOAD_SHELL_CLASS, enabled);
}

/** Prefer document scroll when Overview/FAQ sit under the tool workspace. */
export function setToolPageDocumentScroll(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(TOOL_PAGE_DOCUMENT_SCROLL_CLASS, enabled);
}

/**
 * Sync clean vs active upload UI across tool shells.
 * Sets `data-workspace-phase` on the workspace root(s) so CSS can drive
 * immersive dropzone sizing and control visibility.
 */
export function setWorkspacePhase(phase: WorkspacePhase, root?: HTMLElement | null) {
  if (typeof document === "undefined") return;

  /**
   * Guard against cleanup races (useWorkspaceFileFlow / Strict Mode): a mounted
   * clean upload float must win so #tool-workspace cannot stay "active" and
   * override immersive dropzone CSS via higher-specificity #id selectors.
   */
  if (phase === "active") {
    const cleanFloat = document.querySelector<HTMLElement>(
      '.tool-upload-float[data-workspace-phase="clean"]',
    );
    if (cleanFloat) {
      phase = "clean";
      if (root && !cleanFloat.contains(root) && root !== cleanFloat) {
        // Prefer the live clean shell as the sync root.
        root = cleanFloat;
      }
    }
  }

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
  broadcastWorkspacePhase(phase);
}

export function getWorkspacePhaseFromSignal(fileSignal: boolean | number): WorkspacePhase {
  const hasFiles = typeof fileSignal === "number" ? fileSignal > 0 : Boolean(fileSignal);
  return hasFiles ? "active" : "clean";
}

/** Smooth-scroll every overflow ancestor (window + tool modal) so `el` can sit at top. */
function scrollAncestorsToRevealTop(el: HTMLElement | null) {
  if (typeof window === "undefined") return;

  // Fullscreen tool pages scroll inside `.tool-modal--fullscreen`, not the window.
  let node: HTMLElement | null = el;
  while (node) {
    const parent = node.parentElement;
    if (!parent) break;
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    const isScrollPort =
      overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
    if (isScrollPort && parent.scrollHeight > parent.clientHeight + 1) {
      parent.scrollTo({ top: 0, behavior: "smooth" });
    }
    node = parent;
  }

  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
}

function resolveWorkspaceUploadFocus(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return (
    document.querySelector<HTMLElement>(
      ".tool-upload-float .tool-upload-stage, .tool-upload-float .im-dropzone:not(.im-dropzone--compact), .tool-upload-float",
    ) || document.getElementById(WORKSPACE_UPLOAD_ID)
  );
}

export function scrollToWorkspaceOperations() {
  requestAnimationFrame(() => {
    document.getElementById(WORKSPACE_OPERATIONS_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

/**
 * Bring the upload dropzone into view after "Upload new file".
 * `#workspace-upload` wraps the whole tool page, so scrollIntoView on that id
 * alone is a no-op when the user is already scrolled inside it — scroll the
 * modal/window to top and prefer the float/dropzone as the focus target.
 */
export function scrollToWorkspaceUpload() {
  if (typeof window === "undefined") return;

  const run = () => {
    const focus = resolveWorkspaceUploadFocus();
    scrollAncestorsToRevealTop(focus);
    focus?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  requestAnimationFrame(() => {
    run();
    // Second pass after React commits clean-phase layout (dropzone remount).
    requestAnimationFrame(run);
  });
}
