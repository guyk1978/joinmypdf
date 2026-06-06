"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { toolPrivacyStatement } from "@/lib/tool-ui";

type ToolPrivacyStatementProps = {
  className?: string;
};

/** Single unified privacy note above tool upload zones. */
export function ToolPrivacyStatement({ className }: ToolPrivacyStatementProps) {
  const t = useTranslations("Workspace.common");

  return (
    <p className={clsx(toolPrivacyStatement, "tool-privacy-statement", className)} role="note">
      {t("privacyStatement")}
    </p>
  );
}
