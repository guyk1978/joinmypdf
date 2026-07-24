"use client";

import { clsx } from "clsx";
import { LayoutGrid, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FAVICON_PRESET_CATEGORY_IDS,
  FAVICON_PREVIEW_PRESETS,
  createFaviconPresetFile,
  faviconPresetPreviewDataUrl,
  getFaviconPresetsByCategory,
  type FaviconPresetCategoryId,
  type FaviconPreviewPreset,
} from "@/lib/favicon-previewer-presets";

export type FaviconPreviewerPresetLibraryLabels = {
  openLibrary: string;
  libraryTitle: string;
  libraryHint: string;
  closeLibrary: string;
  usePreset: string;
  categories: Record<FaviconPresetCategoryId, string>;
  presets: Record<string, string>;
};

type FaviconPreviewerPresetLibraryProps = {
  labels: FaviconPreviewerPresetLibraryLabels;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPreset: (file: File, suggestedTitle: string) => void;
  /** Compact trigger shown in the upload column */
  showTrigger?: boolean;
  triggerClassName?: string;
};

function PresetCard({
  preset,
  title,
  useLabel,
  onUse,
}: {
  preset: FaviconPreviewPreset;
  title: string;
  useLabel: string;
  onUse: () => void;
}) {
  const previewUrl = useMemo(() => faviconPresetPreviewDataUrl(preset), [preset]);

  return (
    <article className="favicon-preset-library__card">
      <div className="favicon-preset-library__thumb" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="" width={64} height={64} draggable={false} />
      </div>
      <h3 className="favicon-preset-library__card-title">{title}</h3>
      <button type="button" className="favicon-preset-library__use-btn" onClick={onUse}>
        {useLabel}
      </button>
    </article>
  );
}

export function FaviconPreviewerPresetLibrary({
  labels,
  open,
  onOpenChange,
  onSelectPreset,
  showTrigger = true,
  triggerClassName,
}: FaviconPreviewerPresetLibraryProps) {
  const titleId = useId();
  const hintId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState<FaviconPresetCategoryId>("tech");

  const presets = useMemo(() => getFaviconPresetsByCategory(category), [category]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  const handleUse = (preset: FaviconPreviewPreset) => {
    const title =
      labels.presets[preset.titleKey] || preset.suggestedTitle || preset.titleKey;
    onSelectPreset(createFaviconPresetFile(preset), title);
    onOpenChange(false);
  };

  const drawer =
    mounted && open
      ? createPortal(
          <div className="favicon-preset-library" data-open="1">
            <button
              type="button"
              className="favicon-preset-library__backdrop"
              aria-label={labels.closeLibrary}
              onClick={() => onOpenChange(false)}
            />
            <div
              className="favicon-preset-library__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={hintId}
            >
              <div className="favicon-preset-library__header">
                <div className="favicon-preset-library__header-copy">
                  <h2 id={titleId} className="favicon-preset-library__title">
                    {labels.libraryTitle}
                  </h2>
                  <p id={hintId} className="favicon-preset-library__hint">
                    {labels.libraryHint}
                  </p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  className="favicon-preset-library__close"
                  aria-label={labels.closeLibrary}
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div
                className="favicon-preset-library__tabs"
                role="tablist"
                aria-label={labels.libraryTitle}
              >
                {FAVICON_PRESET_CATEGORY_IDS.map((id) => {
                  const selected = category === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={clsx(
                        "favicon-preset-library__tab",
                        selected && "is-active",
                      )}
                      onClick={() => setCategory(id)}
                    >
                      {labels.categories[id]}
                    </button>
                  );
                })}
              </div>

              <div className="favicon-preset-library__body" role="tabpanel">
                <div className="favicon-preset-library__grid">
                  {presets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      title={
                        labels.presets[preset.titleKey] ||
                        preset.suggestedTitle ||
                        preset.titleKey
                      }
                      useLabel={labels.usePreset}
                      onUse={() => handleUse(preset)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {showTrigger ? (
        <div className={clsx("favicon-preset-library__trigger-wrap", triggerClassName)}>
          <button
            type="button"
            className="favicon-preset-library__trigger"
            onClick={() => onOpenChange(true)}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
            <span>{labels.openLibrary}</span>
            <span className="favicon-preset-library__trigger-count">
              {FAVICON_PREVIEW_PRESETS.length}
            </span>
          </button>
        </div>
      ) : null}
      {drawer}
    </>
  );
}
