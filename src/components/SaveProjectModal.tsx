"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";

type SaveProjectModalProps = {
  open: boolean;
  defaultName?: string;
  busy?: boolean;
  onClose: () => void;
  onSave: (name: string) => void | Promise<void>;
};

export function SaveProjectModal({ open, defaultName = "", busy = false, onClose, onSave }: SaveProjectModalProps) {
  const t = useTranslations("Projects");
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (!open) return;
    setName(defaultName);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, defaultName]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="save-project-modal" role="presentation">
      <button type="button" className="save-project-modal__backdrop" aria-label={t("cancel")} onClick={onClose} />
      <div
        className="save-project-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="save-project-modal__title">
          {t("modalTitle")}
        </h2>
        <p className="save-project-modal__hint">{t("modalHint")}</p>
        <label className="save-project-modal__label" htmlFor={`${titleId}-input`}>
          {t("projectNameLabel")}
        </label>
        <input
          ref={inputRef}
          id={`${titleId}-input`}
          className="save-project-modal__input"
          type="text"
          value={name}
          maxLength={80}
          placeholder={t("projectNamePlaceholder")}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && name.trim() && !busy) {
              void onSave(name.trim());
            }
          }}
        />
        <div className="save-project-modal__actions">
          <button type="button" className={homeSecondaryPillBtn} onClick={onClose} disabled={busy}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className={homePrimaryPillBtn}
            disabled={!name.trim() || busy}
            onClick={() => void onSave(name.trim())}
          >
            {busy ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
