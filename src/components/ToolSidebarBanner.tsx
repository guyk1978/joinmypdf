"use client";

import { clsx } from "clsx";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { PromoSurface } from "@/components/PromoSurface";
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
 *
 * Side banners used to accompany cinematic tool intro rails.
 * Kept as a reusable promo card for related-tool discovery.
 * - Visible from md (768+) when viewport height > ~520px
 * - Progressive sizes: md 150×240 → lg 188×300 → xl 210×340 → 2xl 250×400
 * - Height capped at min(400px, 52vh)
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
    <PromoSurface
      soft
      ariaLabel={ariaLabel ?? title}
      className={clsx(
        "tool-sidebar-banner shrink-0",
        "h-[240px] w-[150px] p-3",
        "lg:h-[300px] lg:w-[188px] lg:p-3.5",
        "xl:h-[340px] xl:w-[210px] xl:p-4",
        "2xl:h-[400px] 2xl:w-[250px] 2xl:p-5",
        "max-h-[min(400px,52vh)]",
        className,
      )}
    >
      <span
        className="relative flex h-8 w-8 items-center justify-center rounded-[var(--im-tool-radius-control,0.5rem)] border border-white/10 bg-white/[0.06] text-white lg:h-9 lg:w-9 xl:h-10 xl:w-10 2xl:h-11 2xl:w-11"
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
        className="relative mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--im-tool-radius-control,0.5rem)] border border-white/15 bg-white px-2.5 text-[0.6875rem] font-bold text-black transition-colors hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 lg:h-10 lg:px-3 lg:text-xs xl:h-10 xl:text-xs 2xl:h-11 2xl:gap-2 2xl:px-4 2xl:text-sm"
      >
        {cta ?? title} {arrow}
      </Link>
    </PromoSurface>
  );
}
