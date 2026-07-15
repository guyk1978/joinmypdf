"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ArrowLeftRight } from "lucide-react";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import {
  convertStorage,
  DEFAULT_FROM_UNIT,
  DEFAULT_TO_UNIT,
  STORAGE_UNITS,
  type StorageUnitId,
} from "@/lib/storage-data-converter";

export type StorageDataConverterLabels = {
  valueLabel: string;
  valuePlaceholder: string;
  fromLabel: string;
  toLabel: string;
  swapLabel: string;
  liveResultLabel: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  resetButton: string;
  emptyHint: string;
  invalidInput: string;
  privacyLabel: string;
  pageTitle: string;
  scaleSiHint: string;
  scaleIecHint: string;
  B: string;
  KB: string;
  MB: string;
  GB: string;
  TB: string;
  PB: string;
  KiB: string;
  MiB: string;
  GiB: string;
  TiB: string;
  PiB: string;
};

type StorageDataConverterProps = {
  labels: StorageDataConverterLabels;
  className?: string;
};

function unitOptionLabel(id: StorageUnitId, labels: StorageDataConverterLabels): string {
  return labels[id];
}

export function StorageDataConverter({ labels, className }: StorageDataConverterProps) {
  const valueId = useId();
  const fromId = useId();
  const toId = useId();

  const [value, setValue] = useState("1");
  const [fromUnit, setFromUnit] = useState<StorageUnitId>(DEFAULT_FROM_UNIT);
  const [toUnit, setToUnit] = useState<StorageUnitId>(DEFAULT_TO_UNIT);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [hasConverted, setHasConverted] = useState(false);

  const result = useMemo(() => convertStorage(value, fromUnit, toUnit), [value, fromUnit, toUnit]);

  useEffect(() => {
    if (interacted && result.ok) setHasConverted(true);
  }, [interacted, result]);

  const liveOutput = result.ok ? result.output : "";
  const errorMessage =
    !result.ok && result.error === "invalid" ? labels.invalidInput : null;

  const markInteracted = () => setInteracted(true);

  const onSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    markInteracted();
  };

  const onCopy = async () => {
    if (!result.ok || !liveOutput) return;
    markInteracted();
    try {
      await navigator.clipboard.writeText(liveOutput);
      setCopied(true);
      setCopyError(null);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(labels.copyFailed);
    }
  };

  const onReset = () => {
    setValue("1");
    setFromUnit(DEFAULT_FROM_UNIT);
    setToUnit(DEFAULT_TO_UNIT);
    setCopied(false);
    setCopyError(null);
  };

  const siUnits = STORAGE_UNITS.filter((u) => u.scale === "byte" || u.scale === "si");
  const iecUnits = STORAGE_UNITS.filter((u) => u.scale === "iec");

  return (
    <div className={clsx("storage-data-tool", className)}>
      <section className="productivity-tool__pane tool-workspace-panel">
        <div className="productivity-tool__pane-header">
          <h2 className="productivity-tool__section-title">{labels.valueLabel}</h2>
          <button type="button" className="productivity-tool__reset-btn" onClick={onReset}>
            {labels.resetButton}
          </button>
        </div>

        <label className="productivity-tool__label" htmlFor={valueId}>
          {labels.valueLabel}
        </label>
        <input
          id={valueId}
          type="text"
          inputMode="decimal"
          className={clsx(
            "productivity-tool__input storage-data-tool__input",
            errorMessage && "storage-data-tool__input--invalid",
          )}
          value={value}
          autoComplete="off"
          spellCheck={false}
          placeholder={labels.valuePlaceholder}
          onChange={(event) => {
            setValue(event.target.value);
            markInteracted();
            setCopied(false);
            setCopyError(null);
          }}
        />

        <div className="storage-data-tool__units">
          <div className="storage-data-tool__field">
            <label className="productivity-tool__label" htmlFor={fromId}>
              {labels.fromLabel}
            </label>
            <select
              id={fromId}
              className="productivity-tool__select"
              value={fromUnit}
              onChange={(event) => {
                setFromUnit(event.target.value as StorageUnitId);
                markInteracted();
              }}
            >
              <optgroup label={labels.scaleSiHint}>
                {siUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unitOptionLabel(unit.id, labels)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={labels.scaleIecHint}>
                {iecUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unitOptionLabel(unit.id, labels)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="storage-data-tool__swap-wrap">
            <button
              type="button"
              className="storage-data-tool__swap"
              onClick={onSwap}
              aria-label={labels.swapLabel}
              title={labels.swapLabel}
            >
              <ArrowLeftRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div className="storage-data-tool__field">
            <label className="productivity-tool__label" htmlFor={toId}>
              {labels.toLabel}
            </label>
            <select
              id={toId}
              className="productivity-tool__select"
              value={toUnit}
              onChange={(event) => {
                setToUnit(event.target.value as StorageUnitId);
                markInteracted();
              }}
            >
              <optgroup label={labels.scaleSiHint}>
                {siUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unitOptionLabel(unit.id, labels)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={labels.scaleIecHint}>
                {iecUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unitOptionLabel(unit.id, labels)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {errorMessage ? (
          <p className="storage-data-tool__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <section className="productivity-tool__pane tool-workspace-panel storage-data-tool__result-pane">
        <div className="productivity-tool__pane-header">
          <h2 className="productivity-tool__section-title">{labels.liveResultLabel}</h2>
          <button
            type="button"
            className="productivity-tool__action-btn"
            onClick={onCopy}
            disabled={!result.ok || !liveOutput}
          >
            {copied ? labels.copied : labels.copyButton}
          </button>
        </div>

        <p
          className={clsx(
            "storage-data-tool__result",
            !result.ok && "storage-data-tool__result--muted",
          )}
          aria-live="polite"
        >
          {result.ok ? (
            <>
              <span className="storage-data-tool__result-value">{liveOutput}</span>
              <span className="storage-data-tool__result-unit">{unitOptionLabel(toUnit, labels)}</span>
            </>
          ) : (
            labels.emptyHint
          )}
        </p>

        {copyError ? <p className="storage-data-tool__error">{copyError}</p> : null}
        <p className="storage-data-tool__privacy">{labels.privacyLabel}</p>
      </section>

      {hasConverted ? (
        <ToolSuccessEngagement pageTitle={labels.pageTitle} className="storage-data-tool__engagement" />
      ) : null}
    </div>
  );
}
