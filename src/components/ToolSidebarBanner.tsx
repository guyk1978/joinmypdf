"use client";

import { clsx } from "clsx";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export type ToolSidebarBannerProps = {
  /** Promoted tool name. */
  title: string;
  /** Short pitch under the title. */
  description: string;
  /** CTA label — falls back to the title when omitted. */
  cta?: string;
  /** Destination tool page (locale-prefixed by next-intl navigation). */
  href: string;
  /** Leading glyph — a lucide icon element in practice. */
  icon: ReactNode;
  /** Accessible name for the promo landmark. */
  ariaLabel?: string;
  className?: string;
};

/**
 * Cross-promo card for the empty side columns of a tool landing.
 * Full size is ~250×400; scales down on md/lg so laptop + browser zoom still fits.
 */
export function ToolSidebarBanner({
  title,
  description,
  cta,
  href,
  icon,
  ariaLabel,
  className,
}: ToolSidebarBannerProps) {
  const locale = useLocale();
  const arrow = locale === "he" ? "←" : "→";

  return (
    <aside
      className={clsx(
        "tool-sidebar-banner relative flex shrink-0 flex-col overflow-hidden",
        // Progressive scale for zoomed laptops (CSS viewport shrinks under browser zoom):
        // md (768+ / ~1366@150%): compact · lg: mid · xl (1280 / 1080p@150%): near-full · 2xl: full
        "h-[240px] w-[150px] p-3",
        "lg:h-[300px] lg:w-[188px] lg:p-3.5",
        "xl:h-[340px] xl:w-[210px] xl:p-4",
        "2xl:h-[400px] 2xl:w-[250px] 2xl:p-5",
        // Cap by viewport height so 1080p @ 150% zoom (~720px CSS) still clears the CTA.
        "max-h-[min(400px,52vh)]",
        // Radius/shadow scales are zeroed in tailwind.config — arbitrary values opt back in.
        "rounded-[1rem] border border-white/10 bg-neutral-950/95 text-start shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        className,
      )}
      aria-label={ariaLabel ?? title}
    >
      <div
        className="pointer-events-none absolute -top-16 end-[-3rem] h-40 w-40 rounded-[999px] bg-white/[0.07] blur-3xl"
        aria-hidden
      />

      <span
        className="relative flex h-8 w-8 items-center justify-center rounded-[0.75rem] border border-white/10 bg-white/[0.06] text-white lg:h-9 lg:w-9 xl:h-10 xl:w-10 2xl:h-11 2xl:w-11"
        aria-hidden
      >
        {icon}
      </span>

      <h2 className="relative mt-3 text-sm font-extrabold leading-tight tracking-tight text-white lg:mt-4 lg:text-base xl:mt-4 xl:text-base 2xl:mt-5 2xl:text-lg">
        {title}
      </h2>
      <p className="relative mt-2 line-clamp-5 text-[0.6875rem] leading-relaxed text-neutral-400 lg:mt-2.5 lg:line-clamp-6 lg:text-[0.75rem] xl:mt-2.5 xl:line-clamp-6 xl:text-[0.75rem] 2xl:mt-3 2xl:line-clamp-none 2xl:text-[0.8125rem]">
        {description}
      </p>

      <Link
        href={href}
        prefetch={false}
        className="relative mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[0.75rem] bg-white px-2.5 text-[0.6875rem] font-bold text-black transition-colors hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 lg:h-10 lg:px-3 lg:text-xs xl:h-10 xl:text-xs 2xl:h-11 2xl:gap-2 2xl:px-4 2xl:text-sm"
      >
        {cta ?? title} {arrow}
      </Link>
    </aside>
  );
}
