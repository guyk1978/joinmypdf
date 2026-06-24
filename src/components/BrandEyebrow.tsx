"use client";

import { clsx } from "clsx";
import { useLocale } from "next-intl";
import { getBrandName } from "@/lib/brand";

type BrandEyebrowProps = {
  className?: string;
};

export function BrandEyebrow({ className }: BrandEyebrowProps) {
  const locale = useLocale();
  const isHe = locale === "he";

  return (
    <p
      className={clsx(
        "text-xs font-semibold text-black dark:text-neutral-200",
        isHe ? "tracking-normal" : "uppercase tracking-[0.18em]",
        className,
      )}
    >
      {getBrandName(locale)}
    </p>
  );
}
