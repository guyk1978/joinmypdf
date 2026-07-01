"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ToolLayout } from "@/components/utility/ToolLayout";
import type { ToolDefinition } from "@/lib/types";
import { JWTDebugger, type JWTDebuggerLabels } from "@/components/tools/developer/JWTDebugger";

type JWTDebuggerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function JWTDebuggerWorkspace({ tool, slug }: JWTDebuggerWorkspaceProps) {
  const t = useTranslations("JWTDebugger");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<JWTDebuggerLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      clearButton: t("clearButton"),
      headerTitle: t("headerTitle"),
      payloadTitle: t("payloadTitle"),
      signatureTitle: t("signatureTitle"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      outputEmpty: t("outputEmpty"),
      expirationTitle: t("expirationTitle"),
      expirationNone: t("expirationNone"),
      expirationAbsolute: t("expirationAbsolute"),
      warningExpired: t("warningExpired"),
      warningSignatureMalformed: t("warningSignatureMalformed"),
      warningSignatureUnverified: t("warningSignatureUnverified"),
      warningAlgNone: t("warningAlgNone"),
      errorEmpty: t("errorEmpty"),
      errorStructure: t("errorStructure"),
      errorInvalid: t("errorInvalid"),
      errorHeader: t("errorHeader"),
      errorPayload: t("errorPayload"),
    }),
    [t],
  );

  return (
    <ToolLayout pageClassName="jwt-debugger-tool-page">
      <JWTDebugger labels={labels} />
    </ToolLayout>
  );
}
