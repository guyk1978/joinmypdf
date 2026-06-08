"use client";

import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

/** Slim solid accent bar below the upload zone — local processing status. */
export function ToolLocalProcessingBar() {
  const t = useTranslations("Workspace.common");

  return (
    <div className="tool-local-accent-bar" role="note">
      <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{t.has("privacyBadge") ? t("privacyBadge") : t("privacyStatement")}</span>
    </div>
  );
}
