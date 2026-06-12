"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { ArrowUpRight, GitBranch } from "lucide-react";

type Props = {
  className?: string;
};

/** Related-tool glass card shown below tool workspaces. */
export function MapDiagramCrossLink({ className }: Props) {
  const t = useTranslations("Partners");

  return (
    <aside
      className={clsx(
        "tool-related-card partner-mapdiagram w-full rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-6",
        className,
      )}
      aria-label={t("mapDiagramAria")}
    >
      <p className="tool-related-card__eyebrow mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-500">
        {t("relatedToolEyebrow")}
      </p>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-sm dark:border-neutral-700 dark:bg-white/[0.04]">
          <GitBranch className="h-6 w-6 text-neutral-600 dark:text-neutral-300" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 md:text-base">
            {t.rich("mapDiagramBody", {
              brand: (chunks) => (
                <span className="font-semibold text-neutral-900 dark:text-white">{chunks}</span>
              ),
            })}
          </p>
          <a
            href="https://mapdiagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-white/50 px-3 py-2 text-sm font-semibold text-neutral-800 transition-all duration-200 hover:border-neutral-400 hover:bg-white/80 dark:border-neutral-700 dark:bg-white/[0.04] dark:text-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-white/[0.08]"
          >
            {t("mapDiagramCta")}
            <ArrowUpRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          </a>
        </div>
      </div>
    </aside>
  );
}
