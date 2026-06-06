"use client";

import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";

type Props = {
  className?: string;
};

function FlowchartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="5" rx="1.5" fill="#6366F1" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" fill="#818CF8" />
      <rect x="8.5" y="16" width="7" height="5" rx="1.5" fill="#4F46E5" />
      <path d="M6.5 8V11.5H12V13.5M17.5 8V11.5H12" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 13.5V16" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Shown below upload zones on homepage and tool workspaces. */
export function MapDiagramCrossLink({ className }: Props) {
  const t = useTranslations("Partners");
  const locale = useLocale();
  const arrow = locale === "he" ? "←" : "→";

  return (
    <aside
      className={clsx(
        "partner-mapdiagram w-full rounded-2xl border border-indigo-100 bg-white px-4 py-3.5 text-left shadow-sm sm:px-5 sm:py-4 dark:border-slate-800 dark:bg-slate-950/50",
        className,
      )}
      aria-label={t("mapDiagramAria")}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-indigo-50 p-2 shadow-sm ring-1 ring-indigo-100 dark:bg-slate-800/80 dark:ring-slate-700">
          <FlowchartIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t.rich("mapDiagramBody", {
              brand: (chunks) => (
                <span className="font-semibold text-slate-900 dark:text-slate-100">{chunks}</span>
              ),
            })}
          </p>
          <a
            href="https://mapdiagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 transition hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {t("mapDiagramCta")} {arrow}
          </a>
        </div>
      </div>
    </aside>
  );
}
