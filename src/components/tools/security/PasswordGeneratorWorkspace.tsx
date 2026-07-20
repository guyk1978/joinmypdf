"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  PasswordGenerator,
  type PasswordGeneratorLabels,
} from "@/components/tools/security/PasswordGenerator";

type PasswordGeneratorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function PasswordGeneratorWorkspace({ tool, slug }: PasswordGeneratorWorkspaceProps) {
  const t = useTranslations("PasswordGenerator");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<PasswordGeneratorLabels>(
    () => ({
      lengthLabel: t("lengthLabel"),
      includeLowercase: t("includeLowercase"),
      includeUppercase: t("includeUppercase"),
      includeNumbers: t("includeNumbers"),
      includeSymbols: t("includeSymbols"),
      outputLabel: t("outputLabel"),
      generateButton: t("generateButton"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      strengthLabel: t("strengthLabel"),
      strengthWeak: t("strengthWeak"),
      strengthFair: t("strengthFair"),
      strengthGood: t("strengthGood"),
      strengthStrong: t("strengthStrong"),
      charsetError: t("charsetError"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="password-generator-tool-page">
      <PasswordGenerator labels={labels} />
    </UtilityWorkspaceShell>
  );
}
