"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import { isNavItemActive } from "@/lib/nav-config";

type HeaderPrivacyIndicatorProps = {
  className?: string;
  onNavigate?: () => void;
};

/** Compact Privacy First pill — always visible in the site header. */
export function HeaderPrivacyIndicator({ className, onNavigate }: HeaderPrivacyIndicatorProps) {
  const t = useTranslations("Header");
  const pathname = usePathname() || "/";
  const active = isNavItemActive(pathname, "/privacy-first/");

  return (
    <Link
      href="/privacy-first/"
      className={clsx(
        "header-privacy-indicator hidden sm:inline-flex",
        active && "header-privacy-indicator--active",
        className,
      )}
      prefetch={false}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
    >
      <Shield className="header-privacy-indicator__icon shrink-0" aria-hidden />
      <span>{t("privacyFirst")}</span>
    </Link>
  );
}
