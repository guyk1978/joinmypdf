"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";

type ToolGridShowMoreButtonProps = {
  remainingCount: number;
  onClick: () => void;
  className?: string;
};

export function ToolGridShowMoreButton({ remainingCount, onClick, className }: ToolGridShowMoreButtonProps) {
  const t = useTranslations("Home");

  if (remainingCount <= 0) return null;

  return (
    <div className={clsx("tool-grid-show-more", className)}>
      <button type="button" className="tool-grid-show-more__button" onClick={onClick}>
        {t("showMoreTools", { count: remainingCount })}
      </button>
    </div>
  );
}
