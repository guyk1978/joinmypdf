"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  WorkspaceProjectControls,
  type WorkspaceProjectRestorePayload,
} from "@/components/WorkspaceProjectControls";
import { toolOutlineBtn } from "@/lib/tool-ui";
import {
  broadcastWorkspaceProjectState,
  requestWorkspaceProjectSave,
} from "@/lib/workspace-project-messages";

type BridgeState = {
  files: File[];
  settings: Record<string, unknown>;
  disabled: boolean;
  onRestore: ((payload: WorkspaceProjectRestorePayload) => void) | null;
  onRestoredStatus?: (message: string) => void;
};

type WorkspaceProjectRegistryValue = {
  toolSlug: string;
  operation: string;
  state: BridgeState;
  setBridge: (next: BridgeState | null) => void;
};

const WorkspaceProjectRegistryContext = createContext<WorkspaceProjectRegistryValue | null>(
  null,
);

const emptyState: BridgeState = {
  files: [],
  settings: {},
  disabled: true,
  onRestore: null,
};

/** Restores that arrived via ?project= before the workspace bridge registered. */
const pendingRestoreBySlug = new Map<string, WorkspaceProjectRestorePayload>();

function findActionsHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const explicit = document.querySelector<HTMLElement>("[data-workspace-actions]");
  if (explicit) return explicit;
  const row = document.querySelector<HTMLElement>("#workspace-operations .workspace-action-row");
  if (row) return row;
  const flexRows = document.querySelectorAll<HTMLElement>(
    "#workspace-operations .flex.flex-wrap.gap-3, #tool-workspace .flex.flex-wrap.gap-3",
  );
  for (const rowEl of flexRows) {
    if (rowEl.querySelector("button")) return rowEl;
  }
  const ops = document.querySelector<HTMLElement>("#workspace-operations");
  return ops;
}

/** Always-mounted save/resume controller (header Save Project talks to this). */
function WorkspaceProjectSaveController() {
  const ctx = useContext(WorkspaceProjectRegistryContext);
  const stateRef = useRef(ctx?.state);
  stateRef.current = ctx?.state;

  const handleRestore = useCallback(
    (payload: WorkspaceProjectRestorePayload) => {
      const onRestore = stateRef.current?.onRestore;
      if (onRestore) {
        onRestore(payload);
        return;
      }
      if (!ctx) return;
      // Bridge not ready yet — stash until useWorkspaceProjectBridge registers.
      pendingRestoreBySlug.set(ctx.toolSlug, payload);
    },
    [ctx],
  );

  if (!ctx) return null;

  // Keep controls mounted even before the tool bridge registers onRestore so
  // Library → Resume (?project=) can load while the workspace hydrates.
  // Save stays disabled until onRestore + files are available.
  return (
    <WorkspaceProjectControls
      toolSlug={ctx.toolSlug}
      operation={ctx.operation}
      files={ctx.state.files}
      settings={ctx.state.settings}
      disabled={ctx.state.disabled || !ctx.state.onRestore}
      hideButton
      onRestore={handleRestore}
      onRestoredStatus={ctx.state.onRestoredStatus}
    />
  );
}

/** Visible Save Project in the workspace action row (triggers the controller). */
function WorkspaceProjectSavePortal() {
  const ctx = useContext(WorkspaceProjectRegistryContext);
  const t = useTranslations("Projects");
  const [host, setHost] = useState<HTMLElement | null>(null);

  const canSave = Boolean(
    ctx?.state.onRestore && !ctx.state.disabled && ctx.state.files.length > 0,
  );

  useEffect(() => {
    if (!ctx?.state.onRestore) {
      setHost((prev) => (prev === null ? prev : null));
      return;
    }

    const sync = () => {
      const nativeSave = document.querySelector<HTMLElement>(
        "[data-workspace-save-project]:not([data-workspace-save-portal] [data-workspace-save-project])",
      );
      // Prefer workspace-owned Save buttons (ConvertToolWorkspace, WorkspaceActionRow).
      if (nativeSave && !nativeSave.closest("[data-workspace-save-portal]")) {
        const stale = document.querySelector("[data-workspace-save-portal]");
        stale?.remove();
        setHost((prev) => (prev === null ? prev : null));
        return;
      }

      const next = findActionsHost();
      if (!next) {
        setHost((prev) => (prev === null ? prev : null));
        return;
      }
      let mount = next.querySelector<HTMLElement>("[data-workspace-save-portal]");
      if (!mount) {
        mount = document.createElement("div");
        mount.setAttribute("data-workspace-save-portal", "");
        mount.style.display = "contents";
        next.appendChild(mount);
      }
      setHost((prev) => (prev === mount ? prev : mount));
    };

    sync();
    const root = document.getElementById("tool-workspace") ?? document.body;
    const mo = new MutationObserver(sync);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [ctx?.state.onRestore, ctx?.state.files.length]);

  useEffect(() => {
    if (!ctx?.state.onRestore) return;
    broadcastWorkspaceProjectState({
      canSave,
      fileCount: ctx.state.files.length,
      toolSlug: ctx.toolSlug,
    });
  }, [canSave, ctx?.state.files.length, ctx?.state.onRestore, ctx?.toolSlug]);

  if (!ctx?.state.onRestore || !host) return null;

  return createPortal(
    <button
      type="button"
      data-workspace-save-project=""
      className={toolOutlineBtn}
      disabled={!canSave}
      onClick={() => requestWorkspaceProjectSave()}
    >
      <Save className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      {t("saveProject")}
    </button>,
    host,
  );
}

export function WorkspaceProjectProvider({
  toolSlug,
  operation,
  children,
}: {
  toolSlug: string;
  operation: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<BridgeState>(emptyState);
  const toolSlugRef = useRef(toolSlug);
  toolSlugRef.current = toolSlug;

  const setBridge = useCallback((next: BridgeState | null) => {
    const resolved = next ?? emptyState;
    setState((prev) => {
      const sameFiles =
        prev.files.length === resolved.files.length &&
        prev.files.every((file, index) => {
          const other = resolved.files[index];
          return (
            other &&
            file.name === other.name &&
            file.size === other.size &&
            file.lastModified === other.lastModified
          );
        });
      const sameSettings =
        JSON.stringify(prev.settings ?? {}) === JSON.stringify(resolved.settings ?? {});
      if (
        sameFiles &&
        sameSettings &&
        prev.disabled === resolved.disabled &&
        prev.onRestore === resolved.onRestore &&
        prev.onRestoredStatus === resolved.onRestoredStatus
      ) {
        return prev;
      }
      return resolved;
    });

    // If a Library → Resume payload arrived before the workspace registered,
    // apply it as soon as onRestore is available (avoids a stuck pending queue).
    if (resolved.onRestore) {
      const slug = toolSlugRef.current;
      const pending = pendingRestoreBySlug.get(slug);
      if (pending) {
        pendingRestoreBySlug.delete(slug);
        const restore = resolved.onRestore;
        Promise.resolve().then(() => {
          restore(pending);
        });
      }
    }
  }, []);

  const value = useMemo(
    () => ({ toolSlug, operation, state, setBridge }),
    [toolSlug, operation, state, setBridge],
  );

  return (
    <WorkspaceProjectRegistryContext.Provider value={value}>
      {children}
      <WorkspaceProjectSaveController />
      <WorkspaceProjectSavePortal />
    </WorkspaceProjectRegistryContext.Provider>
  );
}

/**
 * Register the current workspace files for Library → Projects save/restore.
 * Renders Save Project next to the workspace action buttons via portal.
 */
export function useWorkspaceProjectBridge(options: {
  files: File[];
  settings?: Record<string, unknown>;
  disabled?: boolean;
  onRestore: (payload: WorkspaceProjectRestorePayload) => void;
  onRestoredStatus?: (message: string) => void;
}) {
  const ctx = useContext(WorkspaceProjectRegistryContext);
  const { files, settings, disabled = false, onRestore, onRestoredStatus } = options;
  const filesRef = useRef(files);
  const settingsRef = useRef(settings);
  const onRestoreRef = useRef(onRestore);
  const onRestoredStatusRef = useRef(onRestoredStatus);
  filesRef.current = files;
  settingsRef.current = settings;
  onRestoreRef.current = onRestore;
  onRestoredStatusRef.current = onRestoredStatus;

  // Stable callbacks so setBridge bailout can keep prev state when only the
  // parent re-created inline onRestore/onRestoredStatus closures.
  const stableOnRestore = useCallback((payload: WorkspaceProjectRestorePayload) => {
    onRestoreRef.current(payload);
  }, []);
  const stableOnRestoredStatus = useCallback((message: string) => {
    onRestoredStatusRef.current?.(message);
  }, []);

  const setBridge = ctx?.setBridge;
  const toolSlug = ctx?.toolSlug;

  const filesKey = files
    .map((file) => `${file.name}:${file.size}:${file.lastModified}`)
    .join("|");
  let settingsKey = "";
  try {
    settingsKey = JSON.stringify(settings ?? {});
  } catch {
    settingsKey = String(files.length);
  }

  // IMPORTANT: depend on setBridge (stable), never the whole ctx value —
  // setBridge updates state → new ctx → effect would loop forever.
  useEffect(() => {
    if (!setBridge) return;
    setBridge({
      files: filesRef.current,
      settings: settingsRef.current ?? {},
      disabled,
      onRestore: stableOnRestore,
      onRestoredStatus: onRestoredStatus ? stableOnRestoredStatus : undefined,
    });
  }, [
    setBridge,
    filesKey,
    settingsKey,
    disabled,
    stableOnRestore,
    stableOnRestoredStatus,
    onRestoredStatus,
  ]);

  // Flush a restore that arrived before this workspace registered its handler.
  useEffect(() => {
    if (!toolSlug) return;
    const pending = pendingRestoreBySlug.get(toolSlug);
    if (!pending) return;
    pendingRestoreBySlug.delete(toolSlug);
    onRestoreRef.current(pending);
  }, [toolSlug]);

  useEffect(() => {
    if (!setBridge) return;
    return () => setBridge(null);
  }, [setBridge]);
}
