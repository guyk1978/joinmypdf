"use client";

import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";
import { WattQuickCalculatorIllustration } from "@/components/partner/WattQuickCalculatorIllustration";

export const WATTQUICK_URL = "https://wattquick.com/";

type Props = {
  className?: string;
};

/** Bold financial CTA — loan calculators, debt tools, green home suite (WattQuick). */
export function WattQuickCrossLink({ className }: Props) {
  const t = useTranslations("Partners");
  const locale = useLocale();
  const arrow = locale === "he" ? "←" : "→";

  return (
    <aside
      className={clsx(
        "partner-wattquick w-full overflow-hidden rounded-none border border-neutral-300 bg-neutral-900 p-4 dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
      aria-label={t("wattQuickAria")}
    >
      <div className="grid items-center gap-2 md:grid-cols-2 md:gap-10">
        <div className="text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black dark:text-neutral-200">{t("wattQuickEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {t("wattQuickTitle")}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-black dark:text-neutral-200 sm:text-base">
            {t.rich("wattQuickBody", {
              brand: (chunks) => <span className="font-semibold text-white">{chunks}</span>,
            })}
          </p>
          <a
            href={WATTQUICK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-none border border-neutral-500 bg-neutral-200 px-4 py-2 text-sm font-extrabold text-neutral-950 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 dark:border-neutral-400 dark:bg-neutral-200 dark:text-neutral-950 dark:hover:bg-white"
          >
            {t("wattQuickCta")} {arrow}
          </a>
        </div>

        <div className="relative flex items-center justify-center md:justify-end">
          <div
            className="relative rounded-none bg-white/10 p-4 ring-1 ring-white/25 backdrop-blur-sm sm:p-3"
            aria-hidden="true"
          >
            <div className="absolute -right-2 -top-2 h-16 w-16 rounded-none bg-neutral-200 dark:bg-neutral-800 blur-xl animate-pulse" />
            <div className="absolute -bottom-3 -left-3 h-20 w-20 rounded-none bg-neutral-900 dark:bg-neutral-200/15 blur-xl animate-pulse [animation-delay:500ms]" />
            <WattQuickCalculatorIllustration />
          </div>
        </div>
      </div>
    </aside>
  );
}
