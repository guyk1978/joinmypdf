"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FaviconCodeGenerator, type FaviconCodeGeneratorLabels } from "@/components/FaviconCodeGenerator";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type FaviconCodeGeneratorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function FaviconCodeGeneratorWorkspace({ tool, slug }: FaviconCodeGeneratorWorkspaceProps) {
  const t = useTranslations("FaviconCodeGenerator");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<FaviconCodeGeneratorLabels>(
    () => ({
      instructions: t("instructions"),
      pathLabel: t("pathLabel"),
      pathPlaceholder: t("pathPlaceholder"),
      pathHint: t("pathHint"),
      codeLabel: t("codeLabel"),
      copyCode: t("copyCode"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="favicon-code-generator-tool-page">
        <FaviconCodeGenerator labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
