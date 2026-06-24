"use client";

import { clsx } from "clsx";
import { useLocale } from "next-intl";
import { BRAND_LOGO_HE_AFTER, BRAND_LOGO_HE_BEFORE } from "@/lib/brand";

type JoinMyPdfLogoProps = {
  className?: string;
};

/** Angular geometric eye — monochromatic, theme-aware via currentColor. */
function LogoEye({ className }: { className?: string }) {
  return (
    <svg
      className={clsx(
        "joinmypdf-logo__eye inline-block h-[1.05em] w-[0.78em] shrink-0 align-[-0.08em]",
        "stroke-neutral-800 text-neutral-800 dark:stroke-neutral-100 dark:text-neutral-100",
        className,
      )}
      viewBox="0 0 11 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5.5 1 10 7 5.5 13 1 7 5.5 1Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="miter"
      />
      <path d="M5.5 5.5 7.5 7 5.5 8.5 3.5 7 5.5 5.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const logoSizeClass =
  "text-lg font-black leading-none sm:text-xl lg:text-[1.625rem]";

export function JoinMyPdfLogo({ className }: JoinMyPdfLogoProps) {
  const locale = useLocale();
  const isHe = locale === "he";

  return (
    <span
      className={clsx(
        "joinmypdf-logo inline-flex items-center text-neutral-900 dark:text-neutral-100",
        isHe ? "joinmypdf-logo--he" : "tracking-[0.12em]",
        logoSizeClass,
        className,
      )}
    >
      {isHe ? (
        <span className="joinmypdf-logo__he-inner inline-flex items-center" dir="rtl" aria-hidden="true">
          <span>{BRAND_LOGO_HE_BEFORE}</span>
          <LogoEye className="joinmypdf-logo__eye--he" />
          <span>{BRAND_LOGO_HE_AFTER}</span>
        </span>
      ) : (
        <span className="inline-flex items-center" aria-hidden="true">
          <span>JOINMY</span>
          <LogoEye />
          <span>PDF</span>
        </span>
      )}
    </span>
  );
}
