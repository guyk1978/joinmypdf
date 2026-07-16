"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import { QuickNote, type QuickNoteLabels } from "@/components/tools/productivity/QuickNote";

type QuickNoteWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function QuickNoteWorkspace({ tool, slug }: QuickNoteWorkspaceProps) {
  const t = useTranslations("QuickNote");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<QuickNoteLabels>(
    () => ({
      editorTitle: t("editorTitle"),
      editorEditTitle: t("editorEditTitle"),
      viewerTitle: t("viewerTitle"),
      titleLabel: t("titleLabel"),
      titlePlaceholder: t("titlePlaceholder"),
      contentLabel: t("contentLabel"),
      contentPlaceholder: t("contentPlaceholder"),
      saveButton: t("saveButton"),
      updateButton: t("updateButton"),
      clearButton: t("clearButton"),
      createNewButton: t("createNewButton"),
      editButton: t("editButton"),
      viewButton: t("viewButton"),
      deleteButton: t("deleteButton"),
      closeViewerButton: t("closeViewerButton"),
      listTitle: t("listTitle"),
      emptyList: t("emptyList"),
      discardConfirm: t("discardConfirm"),
      formatSavedAt: (datetime) => t("savedAtLabel", { datetime }),
      untitled: t("untitled"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="quick-note-tool-page">
      <QuickNote labels={labels} />
    </UtilityWorkspaceShell>
  );
}
