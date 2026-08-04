"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useOptionalToolModal } from "@/components/tool-modal/tool-modal-context";
import {
  getMagnifierPreference,
  MAGNIFIER_CAPABILITY_MESSAGE,
  MAGNIFIER_CAPABILITY_QUERY,
  setMagnifierPreference,
  subscribeMagnifierPreference,
} from "@/lib/magnifier-preference";

/**
 * Header loupe ON/OFF control — visible only while a tool workspace
 * reports that a Magnifier preview is mounted.
 */
export function HeaderMagnifierToggle() {
  const t = useTranslations("ToolModal");
  const toolModal = useOptionalToolModal();
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(getMagnifierPreference());
    return subscribeMagnifierPreference(setEnabled);
  }, []);

  useEffect(() => {
    if (!toolModal?.isOpen) {
      setAvailable(false);
      return;
    }

    const onCapability = (event: Event | MessageEvent) => {
      const detail =
        event instanceof CustomEvent
          ? (event as CustomEvent<{ available?: boolean }>).detail
          : event instanceof MessageEvent &&
              event.data &&
              typeof event.data === "object"
            ? (event.data as { available?: boolean })
            : null;
      if (!detail || typeof detail.available !== "boolean") return;
      // Ignore capability posts that aren't our message type when from frames.
      if (event instanceof MessageEvent) {
        const type = (event.data as { type?: string }).type;
        if (type !== MAGNIFIER_CAPABILITY_MESSAGE) return;
      }
      setAvailable(detail.available);
    };

    window.addEventListener(MAGNIFIER_CAPABILITY_MESSAGE, onCapability);
    window.addEventListener("message", onCapability);

    // Ask every tool frame for the current capability (iframe may have mounted first).
    for (let i = 0; i < window.frames.length; i += 1) {
      try {
        window.frames[i]?.postMessage({ type: MAGNIFIER_CAPABILITY_QUERY }, "*");
      } catch {
        /* ignore */
      }
    }

    return () => {
      window.removeEventListener(MAGNIFIER_CAPABILITY_MESSAGE, onCapability);
      window.removeEventListener("message", onCapability);
    };
  }, [toolModal?.isOpen]);

  const toggle = useCallback(() => {
    setMagnifierPreference(!enabled);
  }, [enabled]);

  if (!toolModal?.isOpen || !available) return null;

  const onLabel = t.has("showMagnifier") ? t("showMagnifier") : "Show Magnifier";
  const offLabel = t.has("hideMagnifier") ? t("hideMagnifier") : "Hide Magnifier";
  const label = enabled ? offLabel : onLabel;
  const status = enabled ? "ON" : "OFF";

  return (
    <button
      type="button"
      className={
        enabled
          ? "site-header__nav-link site-header__magnifier-toggle"
          : "site-header__nav-link site-header__magnifier-toggle site-header__magnifier-toggle--off"
      }
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      onClick={toggle}
    >
      <Search className="site-header__nav-icon" aria-hidden size={14} strokeWidth={2} />
      <span className="site-header__magnifier-toggle-label">
        Loupe: <strong>{status}</strong>
      </span>
    </button>
  );
}
