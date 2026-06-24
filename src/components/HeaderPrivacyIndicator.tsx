"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import { isNavItemActive } from "@/lib/nav-config";

type HeaderPrivacyIndicatorProps = {
  className?: string;
  onNavigate?: () => void;
};

/** Privacy First header link — plain nav style with green text. */
export function HeaderPrivacyIndicator({ className, onNavigate }: HeaderPrivacyIndicatorProps) {
  const t = useTranslations("Header");
  const pathname = usePathname() || "/";
  const active = isNavItemActive(pathname, "/privacy-first/");

  return (
    <Link
      href="/privacy-first/"
      className={clsx(
        "nav-link nav-link--privacy hidden sm:inline-flex",
        active && "is-active",
        className,
      )}
      prefetch={false}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
    >
      <span>{t("privacyFirst")}</span>
    </Link>
  );
}
