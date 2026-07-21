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
  /** Called after the tool is pinned (e.g. close modal). */
  onPin?: () => void;
};

export function ToolPinButton({
  toolId,
  className,
  variant = "card",
  onPin,
}: ToolPinButtonProps) {
  const t = useTranslations("PinnedDock");
  const { isPinned, pinTool, unpinTool } = usePinnedTools();
  const pinned = isPinned(toolId);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (pinned) {
      unpinTool(toolId);
      return;
    }
    pinTool(toolId);
    onPin?.();
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
