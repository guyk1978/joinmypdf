"use client";

import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { SaveProjectModal } from "@/components/SaveProjectModal";
import { useProjectToast } from "@/context/ProjectToastContext";
import { saveProject } from "@/lib/project-storage";
import { toolOutlineBtn } from "@/lib/tool-ui";
import {
  WORKSPACE_PROJECT_SAVE_REQUEST,
  WORKSPACE_PROJECT_SAVE_REQUEST_EVENT,
  WORKSPACE_PROJECT_SNAPSHOT_REQUEST,
  broadcastProjectSaved,
  broadcastWorkspaceProjectState,
  postWorkspaceProjectSnapshot,
} from "@/lib/workspace-project-messages";

type SaveProjectButtonProps = {
  toolSlug: string;
  operation: string;
  files: File[];
  settings?: Record<string, unknown>;
  disabled?: boolean;
  className?: string;
  /** Hide the inline button when Save Project lives in the tool modal header. */
  hideButton?: boolean;
};

export function SaveProjectButton({
  toolSlug,
  operation,
  files,
  settings,
  disabled = false,
  className = "",
  hideButton = false,
}: SaveProjectButtonProps) {
  const t = useTranslations("Projects");
  const { showToast } = useProjectToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSave = !disabled && files.length > 0;
  const filesRef = useRef(files);
  const settingsRef = useRef(settings);
  filesRef.current = files;
  settingsRef.current = settings;

  useEffect(() => {
    broadcastWorkspaceProjectState({
      canSave,
      fileCount: files.length,
      toolSlug,
    });
  }, [canSave, files.length, toolSlug]);

  useEffect(() => {
    const openIfReady = () => {
      if (canSave) setOpen(true);
    };

    const replySnapshot = () => {
      postWorkspaceProjectSnapshot({
        canSave: !disabled && filesRef.current.length > 0,
        toolSlug,
        operation,
        files: filesRef.current,
        settings: settingsRef.current,
      });
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: string }).type;
      if (type === WORKSPACE_PROJECT_SAVE_REQUEST) openIfReady();
      if (type === WORKSPACE_PROJECT_SNAPSHOT_REQUEST) replySnapshot();
    };

    const onSaveRequest = () => openIfReady();
    const onSnapshotRequest = () => replySnapshot();

    window.addEventListener("message", onMessage);
    window.addEventListener(WORKSPACE_PROJECT_SAVE_REQUEST_EVENT, onSaveRequest);
    window.addEventListener(WORKSPACE_PROJECT_SNAPSHOT_REQUEST, onSnapshotRequest);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener(WORKSPACE_PROJECT_SAVE_REQUEST_EVENT, onSaveRequest);
      window.removeEventListener(WORKSPACE_PROJECT_SNAPSHOT_REQUEST, onSnapshotRequest);
    };
  }, [canSave, disabled, operation, toolSlug]);

  const handleSave = async (name: string) => {
    setBusy(true);
    try {
      await saveProject({
        name,
        toolSlug,
        operation,
        files,
        settings,
      });
      setOpen(false);
      const toast = t("savedToast");
      showToast(toast);
      broadcastProjectSaved(toast);
    } catch {
      showToast(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {hideButton ? null : (
        <button
          type="button"
          data-workspace-save-project=""
          className={`${toolOutlineBtn} ${className}`.trim()}
          disabled={!canSave}
          onClick={() => setOpen(true)}
        >
          <Save className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {t("saveProject")}
        </button>
      )}
      <SaveProjectModal
        open={open}
        busy={busy}
        defaultName=""
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        onSave={handleSave}
      />
    </>
  );
}
