"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { CaseConverter } from "@/components/tools/CaseConverter";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type CaseConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function CaseConverterWorkspace({ tool, slug }: CaseConverterWorkspaceProps) {
  const t = useTranslations("CaseConverterPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  return (
    <UtilityWorkspaceShell pageClassName="case-converter-tool-page">
      <CaseConverter className="max-w-none" placeholder={t("placeholder")} />
    </UtilityWorkspaceShell>
  );
}
