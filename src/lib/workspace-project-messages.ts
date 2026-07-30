/** Cross-frame bridge: tool iframe ↔ tool-modal header Save Project / Library. */

export const WORKSPACE_PROJECT_STATE_MESSAGE = "joinmypdf:workspace-project-state";
export const WORKSPACE_PROJECT_SAVE_REQUEST = "joinmypdf:workspace-project-save-request";
export const WORKSPACE_PROJECT_SAVE_REQUEST_EVENT = "joinmypdf:workspace-project-save-request";
export const WORKSPACE_PROJECT_SNAPSHOT_REQUEST = "joinmypdf:workspace-project-snapshot-request";
export const WORKSPACE_PROJECT_SNAPSHOT = "joinmypdf:workspace-project-snapshot";
export const PROJECTS_CHANGED_MESSAGE = "joinmypdf:projects-changed";
export const PROJECT_SAVED_MESSAGE = "joinmypdf:project-saved";

export type WorkspaceProjectStatePayload = {
  type: typeof WORKSPACE_PROJECT_STATE_MESSAGE;
  canSave: boolean;
  fileCount: number;
  toolSlug?: string;
};

export type WorkspaceProjectSnapshotPayload = {
  type: typeof WORKSPACE_PROJECT_SNAPSHOT;
  canSave: boolean;
  toolSlug: string;
  operation: string;
  files: File[];
  settings: Record<string, unknown>;
};

export function broadcastWorkspaceProjectState(input: {
  canSave: boolean;
  fileCount: number;
  toolSlug?: string;
}) {
  if (typeof window === "undefined") return;

  const detail = {
    canSave: input.canSave,
    fileCount: input.fileCount,
    toolSlug: input.toolSlug,
  };

  window.dispatchEvent(
    new CustomEvent(WORKSPACE_PROJECT_STATE_MESSAGE, { detail }),
  );

  if (window.parent !== window) {
    try {
      window.parent.postMessage(
        {
          type: WORKSPACE_PROJECT_STATE_MESSAGE,
          ...detail,
        } satisfies WorkspaceProjectStatePayload,
        "*",
      );
    } catch {
      // Cross-origin parent — ignore.
    }
  }
}

/** Ask every tool frame (and this window) to open their local save UI. */
export function requestWorkspaceProjectSave() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(WORKSPACE_PROJECT_SAVE_REQUEST_EVENT));

  for (let index = 0; index < window.frames.length; index += 1) {
    try {
      window.frames[index]?.postMessage({ type: WORKSPACE_PROJECT_SAVE_REQUEST }, "*");
    } catch {
      // Ignore unavailable frames.
    }
  }
}

/** Ask tool frames to post their current files/settings snapshot to the parent. */
export function requestWorkspaceProjectSnapshot() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(WORKSPACE_PROJECT_SNAPSHOT_REQUEST));

  for (let index = 0; index < window.frames.length; index += 1) {
    try {
      window.frames[index]?.postMessage({ type: WORKSPACE_PROJECT_SNAPSHOT_REQUEST }, "*");
    } catch {
      // Ignore unavailable frames.
    }
  }
}

export function postWorkspaceProjectSnapshot(input: {
  canSave: boolean;
  toolSlug: string;
  operation: string;
  files: File[];
  settings?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") return;

  const payload: WorkspaceProjectSnapshotPayload = {
    type: WORKSPACE_PROJECT_SNAPSHOT,
    canSave: input.canSave,
    toolSlug: input.toolSlug,
    operation: input.operation,
    files: input.files,
    settings: input.settings ?? {},
  };

  window.dispatchEvent(new CustomEvent(WORKSPACE_PROJECT_SNAPSHOT, { detail: payload }));

  if (window.parent !== window) {
    try {
      window.parent.postMessage(payload, "*");
    } catch {
      // Cross-origin parent — ignore.
    }
  }
}

/** Notify parent windows (and this window) that IndexedDB projects changed. */
export function broadcastProjectsChanged() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(PROJECTS_CHANGED_MESSAGE));

  if (window.parent !== window) {
    try {
      window.parent.postMessage({ type: PROJECTS_CHANGED_MESSAGE }, "*");
    } catch {
      // ignore
    }
  }

  // Also bubble to top when embedded deeper than one frame.
  if (window.top && window.top !== window && window.top !== window.parent) {
    try {
      window.top.postMessage({ type: PROJECTS_CHANGED_MESSAGE }, "*");
    } catch {
      // ignore
    }
  }
}

export function broadcastProjectSaved(message: string) {
  if (typeof window === "undefined") return;

  const detail = { message };
  window.dispatchEvent(new CustomEvent(PROJECT_SAVED_MESSAGE, { detail }));

  if (window.parent !== window) {
    try {
      window.parent.postMessage({ type: PROJECT_SAVED_MESSAGE, message }, "*");
    } catch {
      // ignore
    }
  }
}

export const TOOL_EMBED_HEIGHT_MESSAGE = "joinmypdf:tool-embed-height";
