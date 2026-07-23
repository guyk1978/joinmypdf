"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useOptionalToolModal } from "@/components/tool-modal/ToolModalProvider";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { ToolListIcon } from "@/components/ToolListIcon";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import {
  getCategoryAccentColor,
  getContrastingInk,
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";
import { usePinnedTools } from "@/hooks/usePinnedTools";
import type { CSSProperties } from "react";

export function PinnedCardsDock() {
  const t = useTranslations("PinnedDock");
  const tTools = useTranslations("Tools");
  const locale = useLocale();
  const modal = useOptionalToolModal();
  const embed = useToolEmbedMode();
  const { pinnedIds, unpinTool, hydrated } = usePinnedTools();

  const chips = useMemo(() => {
    const resolved = [];
    for (const id of pinnedIds) {
      const entry = getToolsInventoryEntry(id);
      if (!entry) continue;
      const categoryId = resolveToolCategoryId(id, entry.primaryCategory);
      const accentCategoryId = resolveToolAccentCategoryId(id, categoryId) ?? categoryId ?? "pdf";
      const accent = getCategoryAccentColor(accentCategoryId);
      resolved.push({
        id,
        label: resolveInventoryToolLabel(id, tTools),
        href: resolveToolHref(id, entry.primaryCategory, locale),
        categoryId,
        accentCategoryId,
        accent,
        ink: getContrastingInk(accent),
      });
    }
    return resolved;
  }, [pinnedIds, locale, tTools]);

  if (embed || !hydrated || chips.length === 0) return null;

  const openTool = (chip: (typeof chips)[number]) => {
    if (!modal) return;
    modal.openToolModal({
      slug: chip.id,
      href: chip.href,
      title: chip.label,
      categoryId: chip.categoryId,
    });
  };

  return (
    <aside
      className="pinned-dock"
      aria-label={t("dockLabel")}
    >
      <div className="pinned-dock__inner">
        {chips.map((chip) => (
          <div
            key={chip.id}
            className="pinned-dock__chip"
            data-category={chip.accentCategoryId}
            style={
              {
                "--category-accent": chip.accent,
                "--pinned-chip-ink": chip.ink,
              } as CSSProperties
            }
          >
            <button
              type="button"
              className="pinned-dock__chip-main"
              onClick={() => openTool(chip)}
              aria-label={t("openTool", { label: chip.label })}
            >
              <span className="pinned-dock__chip-icon" aria-hidden>
                <ToolListIcon slug={chip.id} label={chip.label} size="sm" />
              </span>
              <span className="pinned-dock__chip-label">{chip.label}</span>
            </button>
            <button
              type="button"
              className="pinned-dock__chip-unpin"
              onClick={(event) => {
                event.stopPropagation();
                unpinTool(chip.id);
              }}
              aria-label={t("removeFromDock")}
            >
              <X size={14} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
