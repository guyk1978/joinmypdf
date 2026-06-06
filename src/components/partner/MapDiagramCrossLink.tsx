"use client";

import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";

type Props = {
  className?: string;
};

function FlowchartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="5" rx="0" fill="#525252" />
      <rect x="14" y="3" width="7" height="5" rx="0" fill="#737373" />
      <rect x="8.5" y="16" width="7" height="5" rx="0" fill="#404040" />
      <path d="M6.5 8V11.5H12V13.5M17.5 8V11.5H12" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 13.5V16" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" />
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
        "partner-mapdiagram w-full rounded-none border border-neutral-300 bg-neutral-200 px-2 py-2 text-start dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
      aria-label={t("mapDiagramAria")}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-none border border-neutral-400 bg-neutral-100 p-1.5 dark:border-neutral-700 dark:bg-neutral-800">
          <FlowchartIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">
            {t.rich("mapDiagramBody", {
              brand: (chunks) => (
                <span className="font-semibold text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{chunks}</span>
              ),
            })}
          </p>
          <a
            href="https://mapdiagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-black dark:text-neutral-200 transition hover:text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200 dark:hover:text-black dark:text-neutral-200"
          >
            {t("mapDiagramCta")} {arrow}
          </a>
        </div>
      </div>
    </aside>
  );
}
