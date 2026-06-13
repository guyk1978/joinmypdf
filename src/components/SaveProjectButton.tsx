"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { SaveProjectModal } from "@/components/SaveProjectModal";
import { useProjectToast } from "@/context/ProjectToastContext";
import { saveProject } from "@/lib/project-storage";
import { toolOutlineBtn } from "@/lib/tool-ui";

type SaveProjectButtonProps = {
  toolSlug: string;
  operation: string;
  files: File[];
  settings?: Record<string, unknown>;
  disabled?: boolean;
  className?: string;
};

export function SaveProjectButton({
  toolSlug,
  operation,
  files,
  settings,
  disabled = false,
  className = "",
}: SaveProjectButtonProps) {
  const t = useTranslations("Projects");
  const { showToast } = useProjectToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSave = !disabled && files.length > 0;

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
      showToast(t("savedToast"));
    } catch {
      showToast(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`${toolOutlineBtn} ${className}`.trim()}
        disabled={!canSave}
        onClick={() => setOpen(true)}
      >
        <Save className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        {t("saveProject")}
      </button>
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
