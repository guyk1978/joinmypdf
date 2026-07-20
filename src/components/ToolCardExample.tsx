"use client";

import { useId, useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { renderTextWithLtrUnits } from "@/lib/text-direction";

type ToolCardExampleProps = {
  /** Real-world usage scenario (the localized label is rendered here). */
  example: string;
  /** Start expanded — used by card Focus mode so the example is pre-opened. */
  defaultOpen?: boolean;
  className?: string;
};

/**
 * Subtle "Example" disclosure at the bottom of a tool card description
 * (ported from WattQuick). Expands a small box inside the card instead of a
 * hover tooltip so it works the same on tap (mobile) and click. Sits above
 * the card's overlay link so toggling never navigates.
 */
export function ToolCardExample({
  example,
  defaultOpen = false,
  className,
}: ToolCardExampleProps) {
  const t = useTranslations("ToolCard");
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  if (!example) return null;

  return (
    <span
      className={clsx("tool-card-example", open && "tool-card-example--open", className)}
      onClick={(event) => {
        // The whole disclosure lives inside/above a card link; keep any click
        // on it (toggle, panel text) from bubbling into card navigation.
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        className="tool-card-example__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <Lightbulb className="tool-card-example__icon" strokeWidth={2} aria-hidden />
        {t("example")}
        <ChevronDown className="tool-card-example__chevron" strokeWidth={2} aria-hidden />
      </button>
      <span id={panelId} className="tool-card-example__panel" aria-hidden={!open}>
        <span className="tool-card-example__panel-inner">
          <span className="tool-card-example__text">
            <span className="tool-card-example__label">{t("realWorldExample")} </span>
            {renderTextWithLtrUnits(example)}
          </span>
        </span>
      </span>
    </span>
  );
}
