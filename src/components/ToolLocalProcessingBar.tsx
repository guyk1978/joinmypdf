"use client";

import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

/** Privacy seal below the upload zone — wide thin bordered bar. */
export function ToolLocalProcessingBar() {
  const t = useTranslations("Workspace.common");
  const label = t.has("privacyBadge")
    ? t("privacyBadge")
    : t.has("privacyStatement")
      ? t("privacyStatement")
      : "Local Processing. Nothing is uploaded.";

  return (
    <div className="tool-privacy-seal flex justify-center" role="note">
      <div className="tool-privacy-seal__pill pointer-events-auto inline-flex items-center gap-2">
        <Shield className="tool-privacy-seal__icon h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{label}</span>
      </div>
    </div>
  );
}
