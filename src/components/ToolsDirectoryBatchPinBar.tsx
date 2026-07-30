"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import { useToolsDirectorySelection } from "@/components/ToolsDirectorySelectionContext";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";

/**
 * Global floating batch bar — adds multi-selected tool cards to Library Favorites.
 */
export function ToolsDirectoryBatchPinBar() {
  const selection = useToolsDirectorySelection();
  const { addFavorites } = useFavorites();
  const t = useTranslations("ToolsDirectory");
  const pathname = usePathname();
  const embed = useToolEmbedMode();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const prevPathname = useRef(pathname);
  const clearSelection = selection?.clear;

  useEffect(() => {
    if (!clearSelection) return;
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    clearSelection();
    setFeedback(null);
    setFlash(false);
  }, [pathname, clearSelection]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => {
      setFeedback(null);
      setFlash(false);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  if (embed || !selection) return null;

  const { selectedCount, getSelectedIds, clear } = selection;
  const visible = selectedCount > 0 || Boolean(feedback);

  if (!visible) return null;

  const handleAddToFavorites = () => {
    const ids = getSelectedIds();
    if (!ids.length) return;
    const added = addFavorites(ids);
    clear();
    setFlash(true);
    setFeedback(
      added > 0
        ? t("batchPinSuccess", { count: added })
        : t("batchPinAlreadyPinned"),
    );
  };

  return (
    <div
      className={
        flash
          ? "tools-directory-batch-bar tools-directory-batch-bar--flash"
          : "tools-directory-batch-bar"
      }
      role="region"
      aria-live="polite"
      aria-label={t("batchPinBarLabel")}
    >
      <div className="tools-directory-batch-bar__inner">
        {feedback ? (
          <p className="tools-directory-batch-bar__feedback">{feedback}</p>
        ) : (
          <>
            <span className="tools-directory-batch-bar__count">
              {t("batchPinSelected", { count: selectedCount })}
            </span>
            <button
              type="button"
              className="tools-directory-batch-bar__action"
              onClick={handleAddToFavorites}
            >
              <Heart size={15} strokeWidth={2.25} aria-hidden />
              {t("batchPinAction")}
            </button>
            <button
              type="button"
              className="tools-directory-batch-bar__clear"
              onClick={clear}
            >
              {t("batchPinClear")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
