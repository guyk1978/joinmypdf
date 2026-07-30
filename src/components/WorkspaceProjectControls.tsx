"use client";

import { Suspense, useCallback } from "react";
import { useTranslations } from "next-intl";
import { SaveProjectButton } from "@/components/SaveProjectButton";
import { useProjectResume } from "@/hooks/useProjectResume";

export type WorkspaceProjectRestorePayload = {
  files: File[];
  settings: Record<string, unknown>;
  projectName: string;
};

type WorkspaceProjectControlsProps = {
  toolSlug: string;
  operation: string;
  files: File[];
  settings?: Record<string, unknown>;
  disabled?: boolean;
  className?: string;
  /** Keep save/resume logic mounted without rendering the inline button. */
  hideButton?: boolean;
  /** Restore uploaded files / settings when opening a saved project from Library. */
  onRestore: (payload: WorkspaceProjectRestorePayload) => void;
  /** Optional status line after restore (defaults to Projects.restoredStatus). */
  onRestoredStatus?: (message: string) => void;
};

function WorkspaceProjectControlsInner({
  toolSlug,
  operation,
  files,
  settings,
  disabled = false,
  className = "",
  hideButton = false,
  onRestore,
  onRestoredStatus,
}: WorkspaceProjectControlsProps) {
  const tProjects = useTranslations("Projects");

  const handleRestore = useCallback(
    (payload: WorkspaceProjectRestorePayload) => {
      onRestore(payload);
      const message = tProjects("restoredStatus", { name: payload.projectName });
      onRestoredStatus?.(message);
    },
    [onRestore, onRestoredStatus, tProjects],
  );

  useProjectResume({ toolSlug, onRestore: handleRestore });

  return (
    <SaveProjectButton
      toolSlug={toolSlug}
      operation={operation}
      files={files}
      settings={settings}
      disabled={disabled}
      className={className}
      hideButton={hideButton}
    />
  );
}

/**
 * Save Project button + Library resume (?project=) for any file-based tool workspace.
 * Safe to mount without a local Suspense boundary (wraps useSearchParams internally).
 */
export function WorkspaceProjectControls(props: WorkspaceProjectControlsProps) {
  return (
    <Suspense fallback={null}>
      <WorkspaceProjectControlsInner {...props} />
    </Suspense>
  );
}
