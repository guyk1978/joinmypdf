"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Heart, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFavorites } from "@/hooks/useFavorites";
import { useToolsDirectorySelection } from "@/components/ToolsDirectorySelectionContext";
import { localizeAppHref } from "@/lib/localize-app-href";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { resolveToolCategoryId } from "@/lib/category-accent-colors";

type HomeBatchActionsBarProps = {
  /** Optional class for section-specific styling. */
  className?: string;
  /** When set, the bar only appears if selection intersects these tool ids. */
  scopeIds?: readonly string[];
};

function filterScoped(selected: string[], scope?: readonly string[]): string[] {
  if (!scope?.length) return selected;
  const allowed = new Set(scope);
  return selected.filter((id) => allowed.has(id));
}

/**
 * Inline batch bar under homepage section titles when tool cards are multi-selected.
 */
export function HomeBatchActionsBar({ className, scopeIds }: HomeBatchActionsBarProps) {
  const selection = useToolsDirectorySelection();
  const { addFavorites, removeFavorite } = useFavorites();
  const t = useTranslations("ToolsDirectory");
  const tHome = useTranslations("Home");
  const locale = useLocale();
  const [feedback, setFeedback] = useState<string | null>(null);

  const scopedIds = useMemo(() => {
    if (!selection) return [] as string[];
    return filterScoped(selection.getSelectedIds(), scopeIds);
  }, [selection, scopeIds, selection?.selectedCount]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  if (!selection) return null;
  if (scopedIds.length <= 0 && !feedback) return null;

  const count = scopedIds.length;
  const selectedLabel = tHome.has("landing.batchSelected")
    ? tHome("landing.batchSelected", { count })
    : t("batchPinSelected", { count });

  const favoriteLabel = tHome.has("landing.batchAddFavorites")
    ? tHome("landing.batchAddFavorites")
    : t("batchPinAction");

  const deleteLabel = tHome.has("landing.batchDelete")
    ? tHome("landing.batchDelete")
    : "Delete";

  const downloadLabel = tHome.has("landing.batchDownload")
    ? tHome("landing.batchDownload")
    : "Download";

  const handleAddToFavorites = () => {
    if (!scopedIds.length) return;
    const added = addFavorites(scopedIds);
    selection.remove(scopedIds);
    setFeedback(
      added > 0
        ? t("batchPinSuccess", { count: added })
        : t("batchPinAlreadyPinned"),
    );
  };

  const handleDelete = () => {
    if (!scopedIds.length) return;
    for (const id of scopedIds) removeFavorite(id);
    selection.remove(scopedIds);
    setFeedback(
      tHome.has("landing.batchDeleteDone")
        ? tHome("landing.batchDeleteDone", { count: scopedIds.length })
        : t("batchPinClear"),
    );
  };

  const handleDownload = () => {
    if (!scopedIds.length) return;
    let opened = 0;
    for (const id of scopedIds.slice(0, 6)) {
      const entry = getToolsInventoryEntry(id);
      if (!entry) continue;
      const categoryId = resolveToolCategoryId(id, entry.primaryCategory);
      const href = localizeAppHref(
        resolveToolHref(id, categoryId ?? entry.primaryCategory, locale),
        locale,
      );
      window.open(href, "_blank", "noopener,noreferrer");
      opened += 1;
    }
    selection.remove(scopedIds);
    setFeedback(
      tHome.has("landing.batchDownloadDone")
        ? tHome("landing.batchDownloadDone", { count: opened })
        : selectedLabel,
    );
  };

  return (
    <div
      className={["home-batch-bar", className].filter(Boolean).join(" ")}
      role="region"
      aria-live="polite"
      aria-label={t("batchPinBarLabel")}
    >
      {feedback ? (
        <p className="home-batch-bar__feedback">{feedback}</p>
      ) : (
        <>
          <span className="home-batch-bar__count">{selectedLabel}</span>
          <div className="home-batch-bar__actions">
            <button
              type="button"
              className="home-batch-bar__btn home-batch-bar__btn--primary"
              onClick={handleAddToFavorites}
            >
              <Heart size={14} strokeWidth={2.25} aria-hidden />
              <span>{favoriteLabel}</span>
            </button>
            <button type="button" className="home-batch-bar__btn" onClick={handleDelete}>
              <Trash2 size={14} strokeWidth={2.25} aria-hidden />
              <span>{deleteLabel}</span>
            </button>
            <button type="button" className="home-batch-bar__btn" onClick={handleDownload}>
              <Download size={14} strokeWidth={2.25} aria-hidden />
              <span>{downloadLabel}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
