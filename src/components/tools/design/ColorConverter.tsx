"use client";

import { useId, useState } from "react";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  formatsFromRgb,
  parseColorInput,
  type ColorFormats,
  type ColorInputFormat,
} from "@/lib/color-converter";

export type ColorConverterLabels = {
  previewLabel: string;
  pickerLabel: string;
  hexLabel: string;
  rgbLabel: string;
  hslLabel: string;
  hexPlaceholder: string;
  rgbPlaceholder: string;
  hslPlaceholder: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  invalidValue: string;
  privacyLabel: string;
};

type ColorConverterProps = {
  labels: ColorConverterLabels;
  className?: string;
};

const DEFAULT_RGB = { r: 37, g: 99, b: 235 };

export function ColorConverter({ labels, className }: ColorConverterProps) {
  const pickerId = useId();
  const hexId = useId();
  const rgbId = useId();
  const hslId = useId();

  const [values, setValues] = useState<ColorFormats>(() => formatsFromRgb(DEFAULT_RGB));
  const [invalidField, setInvalidField] = useState<ColorInputFormat | null>(null);
  const [copied, setCopied] = useState<Exclude<ColorInputFormat, "picker"> | null>(null);
  const [copyError, setCopyError] = useState<Exclude<ColorInputFormat, "picker"> | null>(null);

  const updateFrom = (format: ColorInputFormat, raw: string) => {
    if (format !== "picker") {
      setValues((prev) => ({ ...prev, [format]: raw }));
    }

    const parsed = parseColorInput(format, raw);
    if (!parsed.ok) {
      setInvalidField(format);
      setCopyError(null);
      return;
    }

    setValues(formatsFromRgb(parsed.rgb));
    setInvalidField(null);
    setCopyError(null);
  };

  const onCopy = async (format: Exclude<ColorInputFormat, "picker">) => {
    const ok = await copyTextToClipboard(values[format]);
    if (!ok) {
      setCopyError(format);
      setCopied(null);
      return;
    }
    setCopyError(null);
    setCopied(format);
    window.setTimeout(() => {
      setCopied((current) => (current === format ? null : current));
    }, 1400);
  };

  const fieldClass =
    "w-full rounded-md bg-[#1a1a1a] border border-[#262626] px-3 py-2.5 font-mono text-sm text-white outline-none focus-visible:border-[#525252]";

  const rows: Array<{
    format: Exclude<ColorInputFormat, "picker">;
    id: string;
    label: string;
    placeholder: string;
  }> = [
    { format: "hex", id: hexId, label: labels.hexLabel, placeholder: labels.hexPlaceholder },
    { format: "rgb", id: rgbId, label: labels.rgbLabel, placeholder: labels.rgbPlaceholder },
    { format: "hsl", id: hslId, label: labels.hslLabel, placeholder: labels.hslPlaceholder },
  ];

  return (
    <div className={clsx("color-converter-tool", className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <section className="rounded-xl border border-[#262626] bg-[#111111] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#a3a3a3]">
            {labels.previewLabel}
          </p>
          <div
            className="mb-4 h-40 w-full rounded-lg border border-[#262626] shadow-inner"
            style={{ backgroundColor: values.picker }}
            aria-label={labels.previewLabel}
          />
          <label htmlFor={pickerId} className="mb-2 block text-sm font-medium text-[#d4d4d4]">
            {labels.pickerLabel}
          </label>
          <input
            id={pickerId}
            type="color"
            value={values.picker}
            onChange={(event) => updateFrom("picker", event.target.value)}
            className="h-12 w-full cursor-pointer rounded-md border border-[#262626] bg-[#1a1a1a] p-1"
          />
        </section>

        <section className="rounded-xl border border-[#262626] bg-[#111111] p-4 md:p-5">
          <div className="flex flex-col gap-4">
            {rows.map((row) => (
              <div key={row.format}>
                <label htmlFor={row.id} className="mb-2 block text-sm font-medium text-[#d4d4d4]">
                  {row.label}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    id={row.id}
                    value={values[row.format]}
                    onChange={(event) => updateFrom(row.format, event.target.value)}
                    placeholder={row.placeholder}
                    spellCheck={false}
                    className={fieldClass}
                    aria-invalid={invalidField === row.format}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-md border border-[#262626] bg-[#1a1a1a] px-4 py-2.5 text-sm text-white transition-colors hover:border-[#404040]"
                    onClick={() => void onCopy(row.format)}
                  >
                    {copied === row.format ? labels.copied : labels.copyButton}
                  </button>
                </div>
                {invalidField === row.format ? (
                  <p className="mt-2 text-sm text-red-400" role="alert">
                    {labels.invalidValue}
                  </p>
                ) : null}
                {copyError === row.format ? (
                  <p className="mt-2 text-sm text-red-400" role="alert">
                    {labels.copyFailed}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs uppercase tracking-widest text-[#737373]">{labels.privacyLabel}</p>
        </section>
      </div>
    </div>
  );
}
