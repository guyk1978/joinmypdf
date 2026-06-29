"use client";

import { clsx } from "clsx";
import {
  PDF_COMPRESSION_PRESET_ORDER,
  type PdfCompressionPreset,
} from "@/lib/pdf-compress-presets";

type CompressionLevelPickerProps = {
  value: PdfCompressionPreset;
  onChange: (value: PdfCompressionPreset) => void;
  label: string;
  hint: string;
  optionLabels: Record<PdfCompressionPreset, string>;
  optionDescriptions: Record<PdfCompressionPreset, string>;
  name: string;
  className?: string;
};

export function CompressionLevelPicker({
  value,
  onChange,
  label,
  hint,
  optionLabels,
  optionDescriptions,
  name,
  className,
}: CompressionLevelPickerProps) {
  return (
    <fieldset className={clsx("compression-level-picker", className)}>
      <legend className="compression-level-picker__legend">{label}</legend>
      <p className="compression-level-picker__hint">{hint}</p>
      <div className="compression-level-picker__options" role="radiogroup" aria-label={label}>
        {PDF_COMPRESSION_PRESET_ORDER.map((preset) => {
          const selected = value === preset;
          return (
            <label
              key={preset}
              className={clsx(
                "compression-level-picker__option",
                selected && "compression-level-picker__option--selected",
              )}
            >
              <input
                type="radio"
                className="compression-level-picker__input sr-only"
                name={name}
                value={preset}
                checked={selected}
                onChange={() => onChange(preset)}
              />
              <span className="compression-level-picker__option-text">
                <span className="compression-level-picker__option-label">{optionLabels[preset]}</span>
                <span className="compression-level-picker__option-desc">{optionDescriptions[preset]}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
