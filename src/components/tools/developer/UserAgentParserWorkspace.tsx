"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  UserAgentParser,
  type UserAgentParserLabels,
} from "@/components/tools/developer/UserAgentParser";

type UserAgentParserWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function UserAgentParserWorkspace({ tool, slug }: UserAgentParserWorkspaceProps) {
  const t = useTranslations("UserAgentParser");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<UserAgentParserLabels>(
    () => ({
      liveTitle: t("liveTitle"),
      liveHint: t("liveHint"),
      rawUaLabel: t("rawUaLabel"),
      manualTitle: t("manualTitle"),
      manualHint: t("manualHint"),
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      parseButton: t("parseButton"),
      resultsTitle: t("resultsTitle"),
      browserSection: t("browserSection"),
      osSection: t("osSection"),
      deviceSection: t("deviceSection"),
      engineSection: t("engineSection"),
      nameLabel: t("nameLabel"),
      versionLabel: t("versionLabel"),
      modelLabel: t("modelLabel"),
      typeLabel: t("typeLabel"),
      copyJsonButton: t("copyJsonButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="ua-parser-tool-page">
      <UserAgentParser labels={labels} />
    </UtilityWorkspaceShell>
  );
}
