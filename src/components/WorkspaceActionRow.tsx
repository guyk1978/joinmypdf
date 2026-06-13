"use client";

import type { ReactNode } from "react";
import { SaveProjectButton } from "@/components/SaveProjectButton";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";

type WorkspaceActionRowProps = {
  primaryLabel: ReactNode;
  primaryBusyLabel?: ReactNode;
  busy?: boolean;
  disabled?: boolean;
  onPrimary: () => void;
  onClear: () => void;
  clearLabel: ReactNode;
  save: {
    toolSlug: string;
    operation: string;
    files: File[];
    settings?: Record<string, unknown>;
    disabled?: boolean;
  };
};

export function WorkspaceActionRow({
  primaryLabel,
  primaryBusyLabel,
  busy = false,
  disabled = false,
  onPrimary,
  onClear,
  clearLabel,
  save,
}: WorkspaceActionRowProps) {
  return (
    <div className="workspace-action-row flex flex-wrap gap-3">
      <button type="button" disabled={disabled} onClick={onPrimary} className={toolPrimaryBtn}>
        {busy && primaryBusyLabel ? primaryBusyLabel : primaryLabel}
      </button>
      <button type="button" onClick={onClear} className={toolSecondaryBtn}>
        {clearLabel}
      </button>
      <SaveProjectButton
        toolSlug={save.toolSlug}
        operation={save.operation}
        files={save.files}
        settings={save.settings}
        disabled={save.disabled}
      />
    </div>
  );
}
