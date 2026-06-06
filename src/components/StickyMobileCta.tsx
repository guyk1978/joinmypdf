"use client";

import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { capture, EVENTS } from "@/components/AnalyticsClient";

type Props = {
  href: string;
  label: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function StickyMobileCta({ href, label, secondaryHref, secondaryLabel }: Props) {
  return (
    <div
      className={clsx(
        "fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-surface/95 p-3 backdrop-blur md:hidden",
      )}
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <Link
          href={href}
          onClick={() => capture(EVENTS.cta_primary_click, { where: "sticky_mobile" })}
          className="flex-1 rounded-none bg-neutral-200 dark:bg-neutral-800 py-3 text-center text-sm font-semibold text-surface"
        >
          {label}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            onClick={() => capture(EVENTS.cta_secondary_click, { where: "sticky_mobile" })}
            className="flex-1 rounded-none border border-white/15 py-3 text-center text-sm font-semibold text-ink"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
