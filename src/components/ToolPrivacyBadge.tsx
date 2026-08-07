"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Shield } from "lucide-react";

type ToolPrivacyBadgeProps = {
  className?: string;
};

/** Centered privacy notice — local-first trust badge. */
export function ToolPrivacyBadge({ className }: ToolPrivacyBadgeProps) {
  const t = useTranslations("Workspace.common");
  const label = t.has("privacyBadge")
    ? t("privacyBadge")
    : t.has("privacyStatement")
      ? t("privacyStatement")
      : "Processed 100% locally · Zero server uploads";

  return (
    <p
      className={clsx(
        "tool-privacy-badge inline-flex max-w-lg items-center justify-center gap-1.5 text-center text-[11px] leading-snug sm:text-xs",
        className,
      )}
      role="note"
    >
      <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={1.75} />
      <span>{label}</span>
    </p>
  );
}
