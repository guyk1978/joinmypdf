"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Shield } from "lucide-react";
import { useToolGlassTheme } from "@/context/ToolGlassContext";

type ToolPrivacyBadgeProps = {
  className?: string;
};

/** Discreet trusted privacy badge — footer of the tool glass shell. */
export function ToolPrivacyBadge({ className }: ToolPrivacyBadgeProps) {
  const t = useTranslations("Workspace.common");
  const theme = useToolGlassTheme();

  return (
    <p
      className={clsx(
        "tool-privacy-badge flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] leading-snug backdrop-blur-sm",
        theme.badge,
        className,
      )}
      role="note"
    >
      <Shield className={clsx("h-3.5 w-3.5 shrink-0", theme.badgeIcon)} aria-hidden />
      <span>{t.has("privacyBadge") ? t("privacyBadge") : t("privacyStatement")}</span>
    </p>
  );
}
