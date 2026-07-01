"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  formatUuidOutput,
  generateUuidBatch,
  UUID_BULK_COUNTS,
  UUID_VERSIONS,
  type UuidBulkCount,
  type UuidVersion,
} from "@/lib/uuid-generator-tool";

export type UuidGeneratorLabels = {
  versionLabel: string;
  bulkLabel: string;
  generateButton: string;
  copyAllButton: string;
  copyOneButton: string;
  copied: string;
  copyFailed: string;
  outputLabel: string;
  outputEmpty: string;
  unsupportedError: string;
};

type UuidGeneratorProps = {
  labels: UuidGeneratorLabels;
  className?: string;
};

export function UuidGenerator({ labels, className }: UuidGeneratorProps) {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [bulkCount, setBulkCount] = useState<UuidBulkCount>(1);
  const [values, setValues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const onGenerate = () => {
    const result = generateUuidBatch(version, bulkCount);
    if (!result.ok) {
      setValues([]);
      setError(labels.unsupportedError);
      return;
    }

    setValues(result.values);
    setError(null);
  };

  const onCopyAll = async () => {
    if (!values.length) return;
    const success = await copyTextToClipboard(formatUuidOutput(values));
    if (!success) {
      setError(labels.copyFailed);
      return;
    }

    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 1600);
  };

  const onCopyOne = async (value: string, index: number) => {
    const success = await copyTextToClipboard(value);
    if (!success) {
      setError(labels.copyFailed);
      return;
    }

    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1600);
  };

  return (
    <div className={clsx("uuid-generator-tool", className)}>
      <section className="security-tool__pane tool-workspace-panel">
        <div className="uuid-generator-tool__options">
          <div className="uuid-generator-tool__field">
            <label className="security-tool__label" htmlFor="uuid-version">
              {labels.versionLabel}
            </label>
            <select
              id="uuid-version"
              className="security-tool__select"
              value={version}
              onChange={(event) => setVersion(event.target.value as UuidVersion)}
            >
              {UUID_VERSIONS.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="uuid-generator-tool__field">
            <span className="security-tool__label">{labels.bulkLabel}</span>
            <div className="uuid-generator-tool__bulk" role="group" aria-label={labels.bulkLabel}>
              {UUID_BULK_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={clsx(
                    "uuid-generator-tool__bulk-btn",
                    bulkCount === count && "uuid-generator-tool__bulk-btn--active",
                  )}
                  aria-pressed={bulkCount === count}
                  onClick={() => setBulkCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="button" className="security-tool__action-btn" onClick={onGenerate}>
          {labels.generateButton}
        </button>
      </section>

      <section className="security-tool__pane tool-workspace-panel">
        <div className="security-tool__pane-header">
          <span className="security-tool__label">{labels.outputLabel}</span>
          <button
            type="button"
            className={clsx("security-tool__copy-btn", copiedAll && "security-tool__copy-btn--copied")}
            onClick={() => void onCopyAll()}
            disabled={!values.length}
          >
            {copiedAll ? labels.copied : labels.copyAllButton}
          </button>
        </div>

        {error ? (
          <p className="security-tool__error" role="status">
            {error}
          </p>
        ) : null}

        {values.length ? (
          <ul className="uuid-generator-tool__list">
            {values.map((value, index) => (
              <li key={`${value}-${index}`} className="uuid-generator-tool__item">
                <code className="uuid-generator-tool__value">{value}</code>
                <button
                  type="button"
                  className={clsx(
                    "security-tool__copy-btn",
                    copiedIndex === index && "security-tool__copy-btn--copied",
                  )}
                  onClick={() => void onCopyOne(value, index)}
                >
                  {copiedIndex === index ? labels.copied : labels.copyOneButton}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="security-tool__hint">{labels.outputEmpty}</p>
        )}
      </section>
    </div>
  );
}
