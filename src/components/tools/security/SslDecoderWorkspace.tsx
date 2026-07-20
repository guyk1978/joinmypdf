"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import { SslDecoder, type SslDecoderLabels } from "@/components/tools/security/SslDecoder";

type SslDecoderWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function SslDecoderWorkspace({ tool, slug }: SslDecoderWorkspaceProps) {
  const t = useTranslations("SslDecoder");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<SslDecoderLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      decodeButton: t("decodeButton"),
      clearButton: t("clearButton"),
      resultsTitle: t("resultsTitle"),
      emptyHint: t("emptyHint"),
      errorEmpty: t("errorEmpty"),
      errorInvalid: t("errorInvalid"),
      errorParse: t("errorParse"),
      privacyLabel: t("privacyLabel"),
      colField: t("colField"),
      colValue: t("colValue"),
      fieldLabels: {
        issuer: t("fields.issuer"),
        subject: t("fields.subject"),
        validFrom: t("fields.validFrom"),
        validTo: t("fields.validTo"),
        serialNumber: t("fields.serialNumber"),
        signatureAlgorithm: t("fields.signatureAlgorithm"),
        publicKeyAlgorithm: t("fields.publicKeyAlgorithm"),
        publicKeySize: t("fields.publicKeySize"),
        version: t("fields.version"),
      },
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="ssl-decoder-tool-page">
      <SslDecoder labels={labels} />
    </UtilityWorkspaceShell>
  );
}
