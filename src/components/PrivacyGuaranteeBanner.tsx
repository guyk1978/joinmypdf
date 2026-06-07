"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Shield } from "lucide-react";

type PrivacyGuaranteeBannerProps = {
  className?: string;
};

/** Dark glassmorphism privacy guarantee for security-focused tool workspaces. */
export function PrivacyGuaranteeBanner({ className }: PrivacyGuaranteeBannerProps) {
  const t = useTranslations("Workspace.common");

  return (
    <div
      className={clsx(
        "flex gap-3 rounded-none border border-emerald-400/35 bg-emerald-500/[0.08] px-4 py-3 shadow-[0_0_22px_rgba(16,185,129,0.14)] ring-1 ring-emerald-400/25 backdrop-blur-md dark:border-emerald-400/45 dark:bg-emerald-500/10 dark:shadow-[0_0_28px_rgba(16,185,129,0.2)]",
        className,
      )}
      role="note"
    >
      <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">{t("privacyGuaranteeTitle")}</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
          {t("privacyGuaranteeBody")}
        </p>
      </div>
    </div>
  );
}
