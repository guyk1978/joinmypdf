"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { toolSecondaryBtn } from "@/lib/tool-ui";

type WorkspaceNewUploadButtonProps = {
  label: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

export function WorkspaceNewUploadButton({
  label,
  disabled = false,
  onClick,
  className,
}: WorkspaceNewUploadButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(toolSecondaryBtn, className)}
    >
      {label}
    </button>
  );
}
