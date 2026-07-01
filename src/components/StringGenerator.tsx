"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  formatGeneratedOutput,
  generateRandomStrings,
  generateUuidV4Batch,
  STRING_GENERATOR_MAX_LENGTH,
  STRING_GENERATOR_MAX_QUANTITY,
} from "@/lib/string-generator";

export type StringGeneratorLabels = {
  settingsTitle: string;
  lengthLabel: string;
  quantityLabel: string;
  uppercaseLabel: string;
  numbersLabel: string;
  specialLabel: string;
  generateButton: string;
  uuidButton: string;
  outputLabel: string;
  copyButton: string;
  regenerateButton: string;
  copied: string;
  copyFailed: string;
};

type StringGeneratorProps = {
  labels: StringGeneratorLabels;
  className?: string;
};

type GeneratorMode = "random" | "uuid";

export function StringGenerator({ labels, className }: StringGeneratorProps) {
  const [length, setLength] = useState(16);
  const [quantity, setQuantity] = useState(1);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSpecial, setIncludeSpecial] = useState(false);
  const [mode, setMode] = useState<GeneratorMode>("random");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runGenerate = useCallback(
    (nextMode: GeneratorMode) => {
      setMode(nextMode);
      const result =
        nextMode === "uuid"
          ? generateUuidV4Batch(quantity)
          : generateRandomStrings({
              length,
              includeUppercase,
              includeNumbers,
              includeSpecial,
              quantity,
            });

      if (result.ok) {
        setOutput(formatGeneratedOutput(result.values));
        setError(null);
        return;
      }

      setError(result.error);
    },
    [length, quantity, includeUppercase, includeNumbers, includeSpecial],
  );

  useEffect(() => {
    runGenerate("random");
    // Initial output only — further updates use action buttons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGenerateRandom = () => {
    runGenerate("random");
  };

  const onGenerateUuid = () => {
    runGenerate("uuid");
  };

  const onRegenerate = () => {
    runGenerate(mode);
  };

  const onCopy = async () => {
    if (!output) return;
    const success = await copyTextToClipboard(output);
    if (!success) {
      setError(labels.copyFailed);
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={clsx("string-generator-tool", className)}>
      <aside className="string-generator-tool__settings tool-workspace-panel">
        <h2 className="string-generator-tool__settings-title">{labels.settingsTitle}</h2>

        <label className="string-generator-tool__field">
          <span className="string-generator-tool__label">{labels.lengthLabel}</span>
          <input
            type="number"
            className="string-generator-tool__number-input"
            min={1}
            max={STRING_GENERATOR_MAX_LENGTH}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
          />
        </label>

        <label className="string-generator-tool__field">
          <span className="string-generator-tool__label">{labels.quantityLabel}</span>
          <input
            type="number"
            className="string-generator-tool__number-input"
            min={1}
            max={STRING_GENERATOR_MAX_QUANTITY}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </label>

        <div className="string-generator-tool__toggles">
          <label className="string-generator-tool__checkbox">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(event) => setIncludeUppercase(event.target.checked)}
            />
            <span>{labels.uppercaseLabel}</span>
          </label>

          <label className="string-generator-tool__checkbox">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(event) => setIncludeNumbers(event.target.checked)}
            />
            <span>{labels.numbersLabel}</span>
          </label>

          <label className="string-generator-tool__checkbox">
            <input
              type="checkbox"
              checked={includeSpecial}
              onChange={(event) => setIncludeSpecial(event.target.checked)}
            />
            <span>{labels.specialLabel}</span>
          </label>
        </div>

        <div className="string-generator-tool__settings-actions">
          <button type="button" className="string-generator-tool__action-btn" onClick={onGenerateRandom}>
            {labels.generateButton}
          </button>
          <button type="button" className="string-generator-tool__action-btn" onClick={onGenerateUuid}>
            {labels.uuidButton}
          </button>
        </div>
      </aside>

      <div className="string-generator-tool__output tool-workspace-panel">
        <div className="string-generator-tool__output-header">
          <span className="string-generator-tool__label">{labels.outputLabel}</span>
          <div className="string-generator-tool__output-actions">
            <button
              type="button"
              className={clsx(
                "string-generator-tool__copy-btn",
                copied && "string-generator-tool__copy-btn--copied",
              )}
              onClick={() => void onCopy()}
              disabled={!output}
            >
              {copied ? labels.copied : labels.copyButton}
            </button>
            <button
              type="button"
              className="string-generator-tool__regenerate-btn"
              onClick={onRegenerate}
            >
              {labels.regenerateButton}
            </button>
          </div>
        </div>

        {error ? (
          <p className="string-generator-tool__error" role="status">
            {error}
          </p>
        ) : null}

        <pre className="string-generator-tool__code" aria-live="polite">
          {output || "\u00a0"}
        </pre>
      </div>
    </div>
  );
}
