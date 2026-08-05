"use client";

import type { MouseEvent } from "react";
import { Pin } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { usePinnedTools } from "@/hooks/usePinnedTools";

type ToolPinButtonProps = {
  toolId: string;
  className?: string;
  variant?: "card" | "modal" | "focus";
  /** Called after the tool is pinned (e.g. close an overlay). */
  onPin?: () => void;
};

/**
 * Toggle a tool into local pinned-tools storage (does not move cards to a top dock).
 */
export function ToolPinButton({
  toolId,
  className,
  variant = "card",
  onPin,
}: ToolPinButtonProps) {
  const t = useTranslations("PinnedDock");
  const { isPinned, togglePin } = usePinnedTools();
  const pinned = isPinned(toolId);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const nowPinned = togglePin(toolId);
    if (nowPinned) onPin?.();
  };

  return (
    <button
      type="button"
      className={clsx(
        "tool-pin-button",
        `tool-pin-button--${variant}`,
        pinned && "tool-pin-button--active",
        className,
      )}
      onClick={handleClick}
      aria-label={pinned ? t("unpin") : t("pin")}
      aria-pressed={pinned}
      title={pinned ? t("unpin") : t("pin")}
    >
      <Pin
        className="tool-pin-button__icon"
        size={variant === "modal" ? 18 : 14}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}
