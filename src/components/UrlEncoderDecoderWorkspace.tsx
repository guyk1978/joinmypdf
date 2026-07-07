"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UrlEncoderDecoder, type UrlEncoderDecoderLabels } from "@/components/UrlEncoderDecoder";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type UrlEncoderDecoderWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function UrlEncoderDecoderWorkspace({ tool, slug }: UrlEncoderDecoderWorkspaceProps) {
  const t = useTranslations("UrlEncoderDecoder");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<UrlEncoderDecoderLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      outputLabel: t("outputLabel"),
      encodeButton: t("encodeButton"),
      decodeButton: t("decodeButton"),
      copyButton: t("copyButton"),
      clearButton: t("clearButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="url-codec-tool-page">
      <UrlEncoderDecoder labels={labels} />
    </UtilityWorkspaceShell>
  );
}
