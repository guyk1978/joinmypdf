"use client";

import Image from "next/image";
import { clsx } from "clsx";
import { useLocale } from "next-intl";
import { getBrandName } from "@/lib/brand";

type JoinMyPdfLogoProps = {
  className?: string;
};

const LOGO_SRC = "/assets/brand/logo-jmp.png";

export function JoinMyPdfLogo({ className }: JoinMyPdfLogoProps) {
  const locale = useLocale();
  const brandName = getBrandName(locale);

  return (
    <Image
      src={LOGO_SRC}
      alt={brandName}
      width={200}
      height={60}
      className={clsx("joinmypdf-logo w-auto", className)}
      priority
    />
  );
}
