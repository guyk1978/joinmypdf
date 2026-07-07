"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  Base64EncoderDecoder,
  type Base64EncoderDecoderLabels,
} from "@/components/Base64EncoderDecoder";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type Base64EncoderDecoderWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function Base64EncoderDecoderWorkspace({ tool, slug }: Base64EncoderDecoderWorkspaceProps) {
  const t = useTranslations("Base64EncoderDecoder");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<Base64EncoderDecoderLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      outputLabel: t("outputLabel"),
      encodeButton: t("encodeButton"),
      decodeButton: t("decodeButton"),
      uploadButton: t("uploadButton"),
      uploadAria: t("uploadAria"),
      uploadedFile: t("uploadedFile"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="base64-tool-page">
      <Base64EncoderDecoder labels={labels} />
    </UtilityWorkspaceShell>
  );
}
