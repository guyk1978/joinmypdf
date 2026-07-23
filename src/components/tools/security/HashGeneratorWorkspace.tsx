"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import { HashGenerator, type HashGeneratorLabels } from "@/components/tools/security/HashGenerator";

type HashGeneratorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function HashGeneratorWorkspace({ tool, slug }: HashGeneratorWorkspaceProps) {
  const t = useTranslations("HashGenerator");
  const [hasInput, setHasInput] = useState(false);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const onHasInputChange = useCallback((next: boolean) => {
    setHasInput(next);
  }, []);

  const labels = useMemo<HashGeneratorLabels>(
    () => ({
      algorithmLabel: t("algorithmLabel"),
      textInputLabel: t("textInputLabel"),
      textInputPlaceholder: t("textInputPlaceholder"),
      fileDropTitle: t("fileDropTitle"),
      selectFileButton: t("selectFileButton"),
      clearFileButton: t("clearFileButton"),
      hashingFile: t("hashingFile"),
      outputLabel: t("outputLabel"),
      outputEmpty: t("outputEmpty"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      hashError: t("hashError"),
      privacyLabel: t.has("privacyLabel")
        ? t("privacyLabel")
        : "Local Processing. Nothing is uploaded.",
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="hash-generator-tool-page" active={hasInput}>
      <HashGenerator labels={labels} onHasInputChange={onHasInputChange} />
    </UtilityWorkspaceShell>
  );
}
