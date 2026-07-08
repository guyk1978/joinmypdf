"use client";

import { clsx } from "clsx";
import { useLocale } from "next-intl";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import { getBrandName } from "@/lib/brand";

type JoinMyPdfLogoProps = {
  className?: string;
};

export function JoinMyPdfLogo({ className }: JoinMyPdfLogoProps) {
  const locale = useLocale();
  const brandName = getBrandName(locale);

  return (
    <span className={clsx("joinmypdf-logo-text", className)}>
      <HeaderPdfMini className="header-pdf-mini--tight joinmypdf-logo-text__icon text-neutral-50" />
      <span className="joinmypdf-logo-text__word text-3xl font-black tracking-tighter text-neutral-50">
        {locale === "he" ? brandName : "joinmypdf"}
      </span>
    </span>
  );
}
