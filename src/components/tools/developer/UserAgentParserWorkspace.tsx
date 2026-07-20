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
      privacyNotice: t("privacyNotice"),
      inputLabel: t("inputLabel"),
      inputHint: t("inputHint"),
      inputPlaceholder: t("inputPlaceholder"),
      parseButton: t("parseButton"),
      useCurrentButton: t("useCurrentButton"),
      clearButton: t("clearButton"),
      resultsTitle: t("resultsTitle"),
      browserSection: t("browserSection"),
      osSection: t("osSection"),
      deviceSection: t("deviceSection"),
      engineSection: t("engineSection"),
      nameLabel: t("nameLabel"),
      versionLabel: t("versionLabel"),
      typeLabel: t("typeLabel"),
      copyJsonButton: t("copyJsonButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      emptyError: t("emptyError"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="ua-parser-tool-page">
      <UserAgentParser labels={labels} />
    </UtilityWorkspaceShell>
  );
}
