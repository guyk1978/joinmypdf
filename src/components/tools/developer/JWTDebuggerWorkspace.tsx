"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
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
      privacyNotice: t("privacyNotice"),
      inputLabel: t("inputLabel"),
      inputHint: t("inputHint"),
      inputPlaceholder: t("inputPlaceholder"),
      decodeButton: t("decodeButton"),
      clearButton: t("clearButton"),
      resultsTitle: t("resultsTitle"),
      headerTitle: t("headerTitle"),
      payloadTitle: t("payloadTitle"),
      signatureTitle: t("signatureTitle"),
      algorithmLabel: t("algorithmLabel"),
      typeLabel: t("typeLabel"),
      statusLabel: t("statusLabel"),
      signaturePresent: t("signaturePresent"),
      signatureMissing: t("signatureMissing"),
      signatureMalformed: t("signatureMalformed"),
      signatureAlgNone: t("signatureAlgNone"),
      signatureNote: t("signatureNote"),
      copyJsonButton: t("copyJsonButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
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
    <UtilityWorkspaceShell immersive pageClassName="jwt-debugger-tool-page">
      <JWTDebugger labels={labels} />
    </UtilityWorkspaceShell>
  );
}
