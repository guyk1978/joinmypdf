"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { HeaderNavDropdown } from "@/components/HeaderNavDropdown";
import { buildHeaderNavDropdowns } from "@/lib/header-nav";

type HeaderNavProps = {
  onNavigate?: () => void;
};

export function HeaderNav({ onNavigate }: HeaderNavProps) {
  const t = useTranslations("Header");
  const dropdowns = useMemo(() => buildHeaderNavDropdowns((key) => t(key as "nav.image")), [t]);

  return (
    <nav className="site-header__primary-nav" aria-label={t("primaryNav")}>
      {dropdowns.map((dropdown) => (
        <HeaderNavDropdown key={dropdown.id} dropdown={dropdown} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
