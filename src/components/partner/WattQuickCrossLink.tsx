"use client";

import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";
import { PromoSurface } from "@/components/PromoSurface";
import { WattQuickCalculatorIllustration } from "@/components/partner/WattQuickCalculatorIllustration";

export const WATTQUICK_URL = "https://wattquick.com/";

type Props = {
  className?: string;
};

/** Matte partner CTA — loan calculators and related tools (WattQuick). */
export function WattQuickCrossLink({ className }: Props) {
  const t = useTranslations("Partners");
  const locale = useLocale();
  const arrow = locale === "he" ? "←" : "→";

  return (
    <PromoSurface
      ariaLabel={t("wattQuickAria")}
      className={clsx("partner-wattquick w-full p-3 md:p-4", className)}
    >
      <div className="grid items-center gap-3 md:grid-cols-2 md:gap-8">
        <div className="text-neutral-200">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            {t("wattQuickEyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            {t("wattQuickTitle")}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base">
            {t.rich("wattQuickBody", {
              brand: (chunks) => <span className="font-semibold text-white">{chunks}</span>,
            })}
          </p>
          <a
            href={WATTQUICK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-none border border-white/20 bg-white px-4 py-2 text-sm font-extrabold text-neutral-950 transition hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            {t("wattQuickCta")} {arrow}
          </a>
        </div>

        <div className="relative flex items-center justify-center md:justify-end" aria-hidden="true">
          <div className="relative border border-white/10 bg-white/[0.04] p-3 sm:p-4">
            <WattQuickCalculatorIllustration />
          </div>
        </div>
      </div>
    </PromoSurface>
  );
}
