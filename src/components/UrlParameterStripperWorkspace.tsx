"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  UrlParameterStripper,
  type UrlParameterStripperLabels,
} from "@/components/UrlParameterStripper";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type UrlParameterStripperWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function UrlParameterStripperWorkspace({ tool, slug }: UrlParameterStripperWorkspaceProps) {
  const t = useTranslations("UrlParameterStripper");
  const tPage = useTranslations("UrlParameterStripperPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<UrlParameterStripperLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      decodeLabel: t("decodeLabel"),
      autoStripLabel: t("autoStripLabel"),
      stripButton: t("stripButton"),
      clearButton: t("clearButton"),
      outputLabel: t("outputLabel"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      removedLabel: t("removedLabel"),
      emptyHint: t("emptyHint"),
      errorEmpty: t("errorEmpty"),
      errorInvalid: t("errorInvalid"),
      unchangedHint: t("unchangedHint"),
      privacyLabel: t("privacyLabel"),
      pageTitle: tPage("title"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="url-stripper-tool-page">
      <UrlParameterStripper labels={labels} />
    </UtilityWorkspaceShell>
  );
}
