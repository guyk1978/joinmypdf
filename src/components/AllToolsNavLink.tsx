"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutGrid } from "lucide-react";

type AllToolsNavLinkProps = {
  onNavigate?: () => void;
  className?: string;
  compact?: boolean;
};

function isToolsDirectoryActive(pathname: string): boolean {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return path === "/tools/";
}

/** Header link to the full tools directory at /tools/. */
export function AllToolsNavLink({ onNavigate, className, compact = false }: AllToolsNavLinkProps) {
  const t = useTranslations("Header");
  const pathname = usePathname() || "/";
  const active = isToolsDirectoryActive(pathname);

  return (
    <Link
      href="/tools/"
      className={`nav-link${compact ? " nav-link--compact" : ""}${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      prefetch={false}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
    >
      {!compact ? <LayoutGrid className="nav-link__icon shrink-0" aria-hidden /> : null}
      {t("allTools")}
    </Link>
  );
}
