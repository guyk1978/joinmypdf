"use client";

import { clsx } from "clsx";
import { useLocale } from "next-intl";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import { getBrandWordmark } from "@/lib/brand";

type JoinMyPdfLogoProps = {
  className?: string;
};

export function JoinMyPdfLogo({ className }: JoinMyPdfLogoProps) {
  const locale = useLocale();
  const wordmark = getBrandWordmark(locale);
  const isHebrew = locale === "he";

  return (
    <span className={clsx("joinmypdf-logo-text", className)}>
      <HeaderPdfMini className="header-pdf-mini--tight joinmypdf-logo-text__icon" />
      <span
        className={clsx(
          "joinmypdf-logo-text__word font-extrabold",
          !isHebrew && "joinmypdf-logo-text__word--spaced",
        )}
      >
        {isHebrew
          ? wordmark
          : wordmark.split(" ").map((word, index) => (
              <span
                key={word}
                className={clsx(
                  "joinmypdf-logo-text__token",
                  /pdf/i.test(word) && "joinmypdf-logo-text__accent",
                )}
              >
                {index > 0 ? "\u00A0" : null}
                {word}
              </span>
            ))}
      </span>
    </span>
  );
}
