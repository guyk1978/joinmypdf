"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Shield } from "lucide-react";
import { useToolGlassTheme } from "@/context/ToolGlassContext";

type ToolPrivacyBadgeProps = {
  className?: string;
};

/** Centered privacy notice below the main glass container — reference layout. */
export function ToolPrivacyBadge({ className }: ToolPrivacyBadgeProps) {
  const t = useTranslations("Workspace.common");
  const theme = useToolGlassTheme();

  return (
    <p
      className={clsx(
        "tool-privacy-badge inline-flex max-w-lg items-center justify-center gap-1.5 text-center text-[11px] leading-snug text-neutral-500 sm:text-xs",
        className,
      )}
      role="note"
    >
      <Shield className={clsx("h-3.5 w-3.5 shrink-0", theme.badgeIcon)} aria-hidden />
      <span>{t.has("privacyBadge") ? t("privacyBadge") : t("privacyStatement")}</span>
    </p>
  );
}
