"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { ShieldCheck } from "lucide-react";

type OptimizationRepairNoticeProps = {
  className?: string;
};

/** Privacy notice for optimization and repair tools. */
export function OptimizationRepairNotice({ className }: OptimizationRepairNoticeProps) {
  const t = useTranslations("Workspace.common");

  return (
    <p
      className={clsx(
        "flex items-center gap-2 rounded-none border border-emerald-400/35 bg-emerald-500/[0.08] px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-400/25 backdrop-blur-md dark:border-emerald-400/45 dark:bg-emerald-500/10 dark:text-emerald-200",
        className,
      )}
      role="note"
    >
      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      {t("optimizationRepairNotice")}
    </p>
  );
}
