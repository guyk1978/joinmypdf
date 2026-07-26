"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

export type PromoSurfaceProps = {
  children: ReactNode;
  /** Accessible name for the promo landmark. */
  ariaLabel?: string;
  className?: string;
  /** Soft interior radius (tool-promo cards). Chrome stays sharp. */
  soft?: boolean;
};

/**
 * Shared matte promo shell — hairline border, near-black fill, no glow/pills.
 * Used by intro side banners and partner cross-links.
 */
export function PromoSurface({ children, ariaLabel, className, soft = false }: PromoSurfaceProps) {
  return (
    <aside
      className={clsx(
        "promo-surface relative flex flex-col overflow-hidden border border-white/10 bg-neutral-950 text-start",
        soft ? "rounded-[var(--im-tool-radius,0.5rem)]" : "rounded-none",
        className,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </aside>
  );
}
