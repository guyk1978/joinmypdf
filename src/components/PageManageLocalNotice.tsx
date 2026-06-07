"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Cpu } from "lucide-react";

type PageManageLocalNoticeProps = {
  className?: string;
};

/** Compact local-processing notice for page management tools. */
export function PageManageLocalNotice({ className }: PageManageLocalNoticeProps) {
  const t = useTranslations("Workspace.common");

  return (
    <p
      className={clsx(
        "flex items-center gap-2 rounded-none border border-violet-400/30 bg-violet-500/[0.06] px-3 py-2 text-xs text-violet-900 ring-1 ring-violet-400/20 backdrop-blur-md dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-200",
        className,
      )}
      role="note"
    >
      <Cpu className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
      {t("pageManageNotice")}
    </p>
  );
}
