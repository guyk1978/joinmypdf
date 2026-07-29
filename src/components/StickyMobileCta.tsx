"use client";

import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { capture, EVENTS } from "@/components/AnalyticsClient";

type Props = {
  href: string;
  label: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

/**
 * Mobile-only sticky CTA. Hidden during clean-phase dropzone
 * so it does not stack with immersive chrome.
 */
export function StickyMobileCta({ href, label, secondaryHref, secondaryLabel }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      const html = document.documentElement;
      const clean = html.classList.contains("workspace-phase-clean");
      setVisible(!clean);
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-workspace-phase"],
    });
    return () => mo.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div
      className={clsx(
        "sticky-mobile-cta fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-neutral-950/95 p-3 md:hidden",
      )}
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <Link
          href={href}
          onClick={() => capture(EVENTS.cta_primary_click, { where: "sticky_mobile" })}
          className="flex-1 rounded-none bg-neutral-200 py-3 text-center text-sm font-semibold text-neutral-950 dark:bg-neutral-200"
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
