"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import {
  ToolBreadcrumbs,
  type ToolBreadcrumbItem,
} from "@/components/layout/ToolBreadcrumbs";
import { registry } from "@/lib/registry";
import { buildDocH1Title, normalizeToolNameForDocH1 } from "@/lib/tool-doc-h1";
import {
  buildToolPageBreadcrumbs,
  INVENTORY_BREADCRUMB_LABEL_KEYS,
} from "@/lib/tool-breadcrumb-hub";
import { resolveToolCategoryId } from "@/lib/category-accent-colors";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { INVENTORY_HUB_META } from "@/data/inventory-hubs";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import type { ToolPageTranslator } from "@/lib/i18n-tool-page";

export type ToolDocHeaderProps = {
  slug: string;
  /** Plain tool name used for crumbs + H1 base (not the SEO-wrapped form). */
  title: string;
  /** Short intro under the H1. */
  description?: string | null;
  categoryId?: InventoryCategoryId;
  /** Optional prebuilt crumbs; when omitted, built from slug + inventory. */
  breadcrumbItems?: ToolBreadcrumbItem[];
  className?: string;
};

function localizeCrumbLabel(
  tPage: ReturnType<typeof useTranslations<"ToolPage">>,
  key: string,
  fallback: string,
): string {
  try {
    if (tPage.has(key)) {
      const value = tPage(key);
      if (value && value !== key && !value.startsWith("breadcrumb")) return value;
    }
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Canonical [DOC] tab masthead for every tool:
 * Breadcrumbs → SEO H1 → intro lead → horizontal rule.
 */
export function ToolDocHeader({
  slug,
  title,
  description,
  categoryId: categoryIdProp,
  breadcrumbItems,
  className,
}: ToolDocHeaderProps) {
  const locale = useLocale();
  const tPage = useTranslations("ToolPage");
  const tModal = useTranslations("ToolModal");

  const plainTitle = normalizeToolNameForDocH1(title) || title.trim();
  const categoryId =
    categoryIdProp ??
    resolveToolCategoryId(slug) ??
    getToolsInventoryEntry(slug)?.primaryCategory;

  const toolMeta = useMemo(() => {
    const registryTool = registry.tools.find((entry) => entry.slug === slug);
    return {
      slug,
      title: plainTitle,
      category: registryTool?.category ?? "convert",
    };
  }, [slug, plainTitle]);

  const crumbs = useMemo(() => {
    if (breadcrumbItems?.length) {
      return breadcrumbItems.map((item) => ({
        ...item,
        label:
          item.label.startsWith("breadcrumb") || item.label.includes(".")
            ? localizeCrumbLabel(tPage, item.label, item.label.replace(/^breadcrumb(Hub)?/i, "") || item.label)
            : item.label,
      }));
    }

    const trail = buildToolPageBreadcrumbs({
      slug,
      toolTitle: plainTitle,
      categoryId: categoryId as InventoryCategoryId | undefined,
      seoCategory: toolMeta.category,
      locale,
      toolPath: resolveToolHref(slug, categoryId, locale),
      tPage: {
        ...(tPage as unknown as ToolPageTranslator),
        has: (key: string) => {
          try {
            return tPage.has(key);
          } catch {
            return false;
          }
        },
      } as ToolPageTranslator,
    });

    return trail.map((crumb) => {
      let label = crumb.name;
      if (!label || label.startsWith("breadcrumb")) {
        if (categoryId && INVENTORY_BREADCRUMB_LABEL_KEYS[categoryId as InventoryCategoryId]) {
          const hubKey = INVENTORY_BREADCRUMB_LABEL_KEYS[categoryId as InventoryCategoryId];
          if (label === hubKey || label.startsWith("breadcrumbHub")) {
            label =
              localizeCrumbLabel(tPage, hubKey, INVENTORY_HUB_META[categoryId as InventoryCategoryId]?.title ?? "Tools");
          }
        }
        if (label.startsWith("breadcrumb") || !label) {
          label = localizeCrumbLabel(tPage, label || "breadcrumbAllTools", plainTitle);
        }
      }
      return { label, href: crumb.path };
    });
  }, [breadcrumbItems, slug, plainTitle, categoryId, toolMeta.category, locale, tPage]);

  const docH1 = tModal.has("docH1Template")
    ? tModal("docH1Template", { toolName: plainTitle })
    : buildDocH1Title(plainTitle);

  const lead = (description ?? "").replace(/\s+/g, " ").trim();

  return (
    <header className={clsx("tool-modal-docs__header", className)}>
      {crumbs.length > 0 ? (
        <div className="tool-modal-docs__crumbs">
          <ToolBreadcrumbs
            tool={toolMeta}
            category={String(categoryId ?? toolMeta.category)}
            items={crumbs}
          />
        </div>
      ) : null}

      <h1 className="tool-modal-docs__title" id="tool-docs-title">
        {docH1}
      </h1>

      {lead ? <p className="tool-modal-docs__lead">{lead}</p> : null}

      <div className="tool-modal-docs__rule" aria-hidden="true" />
    </header>
  );
}
