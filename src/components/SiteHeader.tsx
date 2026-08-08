"use client";

import { clsx } from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { SiteHeaderBar } from "@/components/SiteHeaderBar";
import { useSiteChromeCollapsed } from "@/hooks/useSiteChromeCollapsed";

/** Global site header — solid, sticky; collapsible to free workspace height. */
export function SiteHeader() {
  const t = useTranslations("Header");
  const { collapsed, toggle } = useSiteChromeCollapsed("header");
  const collapseLabel = t.has("collapseChrome")
    ? t("collapseChrome")
    : "Hide header";
  const expandLabel = t.has("expandChrome") ? t("expandChrome") : "Show header";

  return (
    <header
      className={clsx(
        "site-header site-header--matte site-header--clean z-[120] w-full shrink-0",
        collapsed && "site-header--collapsed",
      )}
      data-chrome-collapsed={collapsed ? "1" : "0"}
    >
      <div className="site-header__visual" id="site-header-chrome">
        <SiteHeaderBar />
        <button
          type="button"
          className="site-chrome-toggle site-chrome-toggle--header-collapse"
          aria-label={collapseLabel}
          aria-expanded={!collapsed}
          aria-controls="site-header-chrome"
          onClick={toggle}
        >
          <ChevronUp className="site-chrome-toggle__icon" aria-hidden size={14} strokeWidth={2.25} />
        </button>
      </div>

      <button
        type="button"
        className="site-chrome-toggle site-chrome-toggle--header-expand"
        aria-label={expandLabel}
        aria-expanded={!collapsed}
        hidden={!collapsed}
        onClick={toggle}
      >
        <ChevronDown className="site-chrome-toggle__icon" aria-hidden size={14} strokeWidth={2.25} />
        <span className="site-chrome-toggle__label">{expandLabel}</span>
      </button>
    </header>
  );
}
