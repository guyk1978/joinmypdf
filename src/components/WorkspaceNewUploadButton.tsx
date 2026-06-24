"use client";

import type { ReactNode } from "react";
import { toolSecondaryBtn } from "@/lib/tool-ui";

type WorkspaceNewUploadButtonProps = {
  label: ReactNode;
  disabled?: boolean;
  onClick: () => void;
};

export function WorkspaceNewUploadButton({
  label,
  disabled = false,
  onClick,
}: WorkspaceNewUploadButtonProps) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={toolSecondaryBtn}>
      {label}
    </button>
  );
}
