import { clsx } from "clsx";
import { WattQuickCalculatorIllustration } from "@/components/partner/WattQuickCalculatorIllustration";

export const WATTQUICK_URL = "https://wattquick.com/";

type Props = {
  className?: string;
};

/** Bold financial CTA — loan calculators, debt tools, green home suite (WattQuick). */
export function WattQuickCrossLink({ className }: Props) {
  return (
    <aside
      className={clsx(
        "partner-wattquick w-full overflow-hidden rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 shadow-xl sm:p-8",
        "dark:border-amber-500/40 dark:from-slate-900 dark:to-slate-800",
        className,
      )}
      aria-label="Partner tool: WattQuick financial calculators"
    >
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
        <div className="text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Free financial tools</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            Take Control of Your Numbers
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-blue-100 sm:text-base">
            Check out <span className="font-semibold text-white">WattQuick</span> — our free suite of auto loan
            trackers, debt calculators, and green home tools.
          </p>
          <a
            href={WATTQUICK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition-transform hover:scale-105 hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            Explore WattQuick free →
          </a>
        </div>

        <div className="relative flex items-center justify-center md:justify-end">
          <div
            className="relative rounded-2xl bg-white/10 p-4 ring-1 ring-white/25 backdrop-blur-sm sm:p-5"
            aria-hidden="true"
          >
            <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
            <div className="absolute -bottom-3 -left-3 h-20 w-20 rounded-full bg-emerald-400/15 blur-xl animate-pulse [animation-delay:500ms]" />
            <WattQuickCalculatorIllustration />
          </div>
        </div>
      </div>
    </aside>
  );
}
