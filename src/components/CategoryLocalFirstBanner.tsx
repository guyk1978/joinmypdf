"use client";

import { Lock, Shield, Zap } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import "@/styles/category-hub-marketing.css";

type CategoryLocalFirstBannerProps = {
  className?: string;
};

/**
 * Compact local-first guarantee banner for category hubs.
 */
export function CategoryLocalFirstBanner({ className }: CategoryLocalFirstBannerProps) {
  const t = useTranslations("ToolsDirectory.localFirstBanner");

  return (
    <aside
      className={clsx("chm-banner", className)}
      aria-label={t("ariaLabel")}
    >
      <div className="chm-banner__intro">
        <p className="chm-banner__eyebrow">{t("eyebrow")}</p>
        <h2 className="chm-banner__title">{t("title")}</h2>
        <p className="chm-banner__text" dir="auto">
          {t("body")}
        </p>
      </div>
      <ul className="chm-banner__pills">
        <li>
          <Shield aria-hidden strokeWidth={1.5} />
          {t("privacy")}
        </li>
        <li>
          <Zap aria-hidden strokeWidth={1.5} />
          {t("speed")}
        </li>
        <li>
          <Lock aria-hidden strokeWidth={1.5} />
          {t("zeroUploads")}
        </li>
      </ul>
    </aside>
  );
}
