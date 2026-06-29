"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

const MARKETING_IMAGE = {
  he: { src: "/img/home-photo-he.png", width: 1366, height: 676 },
  en: { src: "/img/home-photo-en.png", width: 1352, height: 676 },
} as const;

export function HomeMarketingBanner() {
  const locale = useLocale();
  const t = useTranslations("Home");
  const lang = locale === "he" ? "he" : "en";
  const { src, width, height } = MARKETING_IMAGE[lang];
  const alt = `${t("marketingTitle")}. ${t("marketingDescription")}`;

  return (
    <aside
      className="home-marketing-banner"
      dir={lang === "he" ? "rtl" : "ltr"}
      aria-label={alt}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="home-marketing-banner__image"
        sizes="(min-width: 1024px) 48vw, 100vw"
        priority
      />
    </aside>
  );
}
