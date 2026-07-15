"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import {
  BITWISE_OPS,
  convertBase,
  convertWithBitwise,
  getBaseLabelKey,
  NUMBER_BASES,
  type BitwiseOp,
  type NumberBase,
} from "@/lib/base-converter";

export type BaseConverterLabels = {
  sourceLabel: string;
  sourcePlaceholder: string;
  fromBaseLabel: string;
  toBaseLabel: string;
  liveResultLabel: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  resetButton: string;
  emptyHint: string;
  invalidDigits: string;
  privacyLabel: string;
  pageTitle: string;
  binary: string;
  octal: string;
  decimal: string;
  hexadecimal: string;
  bitwiseTitle: string;
  bitwiseHint: string;
  bitwiseEnable: string;
  bitwiseOperandLabel: string;
  bitwiseOperandPlaceholder: string;
  bitwiseOpLabel: string;
  bitwiseAnd: string;
  bitwiseOr: string;
  bitwiseXor: string;
  bitwiseBinaryLabel: string;
};

type BaseConverterProps = {
  labels: BaseConverterLabels;
  className?: string;
};

function baseOptionLabel(base: NumberBase, labels: BaseConverterLabels): string {
  const name = labels[getBaseLabelKey(base)];
  return `${name} (${base})`;
}

function opLabel(op: BitwiseOp, labels: BaseConverterLabels): string {
  switch (op) {
    case "and":
      return labels.bitwiseAnd;
    case "or":
      return labels.bitwiseOr;
    case "xor":
      return labels.bitwiseXor;
  }
}

export function BaseConverter({ labels, className }: BaseConverterProps) {
  const sourceId = useId();
  const fromId = useId();
  const toId = useId();
  const operandId = useId();
  const opId = useId();

  const [source, setSource] = useState("1010");
  const [fromBase, setFromBase] = useState<NumberBase>(2);
  const [toBase, setToBase] = useState<NumberBase>(10);
  const [bitwiseEnabled, setBitwiseEnabled] = useState(false);
  const [operandB, setOperandB] = useState("1100");
  const [bitwiseOp, setBitwiseOp] = useState<BitwiseOp>("and");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [hasConverted, setHasConverted] = useState(false);

  const showBitwisePanel = fromBase === 2;

  const result = useMemo(() => {
    if (showBitwisePanel && bitwiseEnabled) {
      return convertWithBitwise(source, operandB, fromBase, toBase, bitwiseOp);
    }
    return convertBase(source, fromBase, toBase);
  }, [source, operandB, fromBase, toBase, bitwiseEnabled, bitwiseOp, showBitwisePanel]);

  useEffect(() => {
    if (interacted && result.ok) setHasConverted(true);
  }, [interacted, result]);

  const liveOutput = result.ok ? result.output : "";
  const binaryPreview: string | null =
    bitwiseEnabled && result.ok && "binary" in result ? String(result.binary) : null;

  const errorMessage = (() => {
    if (result.ok) return null;
    if (result.error === "empty") return null;
    return labels.invalidDigits;
  })();

  const markInteracted = () => setInteracted(true);

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
    setSource("1010");
    setFromBase(2);
    setToBase(10);
    setBitwiseEnabled(false);
    setOperandB("1100");
    setBitwiseOp("and");
    setCopied(false);
    setCopyError(null);
  };

  return (
    <div className={clsx("base-converter-tool", className)}>
      <section className="productivity-tool__pane tool-workspace-panel">
        <div className="productivity-tool__pane-header">
          <h2 className="productivity-tool__section-title">{labels.sourceLabel}</h2>
          <button type="button" className="productivity-tool__reset-btn" onClick={onReset}>
            {labels.resetButton}
          </button>
        </div>

        <label className="productivity-tool__label" htmlFor={sourceId}>
          {labels.sourceLabel}
        </label>
        <input
          id={sourceId}
          type="text"
          className={clsx(
            "productivity-tool__input base-converter-tool__input",
            errorMessage && "base-converter-tool__input--invalid",
          )}
          value={source}
          spellCheck={false}
          autoComplete="off"
          placeholder={labels.sourcePlaceholder}
          onChange={(event) => {
            setSource(event.target.value);
            markInteracted();
            setCopied(false);
            setCopyError(null);
          }}
        />

        <div className="base-converter-tool__bases">
          <div className="base-converter-tool__field">
            <label className="productivity-tool__label" htmlFor={fromId}>
              {labels.fromBaseLabel}
            </label>
            <select
              id={fromId}
              className="productivity-tool__select"
              value={fromBase}
              onChange={(event) => {
                const next = Number(event.target.value) as NumberBase;
                setFromBase(next);
                if (next !== 2) setBitwiseEnabled(false);
                markInteracted();
              }}
            >
              {NUMBER_BASES.map((base) => (
                <option key={base} value={base}>
                  {baseOptionLabel(base, labels)}
                </option>
              ))}
            </select>
          </div>

          <div className="base-converter-tool__field">
            <label className="productivity-tool__label" htmlFor={toId}>
              {labels.toBaseLabel}
            </label>
            <select
              id={toId}
              className="productivity-tool__select"
              value={toBase}
              onChange={(event) => {
                setToBase(Number(event.target.value) as NumberBase);
                markInteracted();
              }}
            >
              {NUMBER_BASES.map((base) => (
                <option key={base} value={base}>
                  {baseOptionLabel(base, labels)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage ? (
          <p className="base-converter-tool__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>

      {showBitwisePanel ? (
        <section className="productivity-tool__pane tool-workspace-panel base-converter-tool__bitwise">
          <div className="productivity-tool__pane-header">
            <h2 className="productivity-tool__section-title">{labels.bitwiseTitle}</h2>
          </div>
          <p className="base-converter-tool__hint">{labels.bitwiseHint}</p>

          <label className="base-converter-tool__toggle">
            <input
              type="checkbox"
              checked={bitwiseEnabled}
              onChange={(event) => {
                setBitwiseEnabled(event.target.checked);
                markInteracted();
              }}
            />
            <span>{labels.bitwiseEnable}</span>
          </label>

          {bitwiseEnabled ? (
            <div className="base-converter-tool__bitwise-grid">
              <div className="base-converter-tool__field">
                <label className="productivity-tool__label" htmlFor={opId}>
                  {labels.bitwiseOpLabel}
                </label>
                <select
                  id={opId}
                  className="productivity-tool__select"
                  value={bitwiseOp}
                  onChange={(event) => {
                    setBitwiseOp(event.target.value as BitwiseOp);
                    markInteracted();
                  }}
                >
                  {BITWISE_OPS.map((op) => (
                    <option key={op} value={op}>
                      {opLabel(op, labels)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="base-converter-tool__field">
                <label className="productivity-tool__label" htmlFor={operandId}>
                  {labels.bitwiseOperandLabel}
                </label>
                <input
                  id={operandId}
                  type="text"
                  className="productivity-tool__input"
                  value={operandB}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder={labels.bitwiseOperandPlaceholder}
                  onChange={(event) => {
                    setOperandB(event.target.value);
                    markInteracted();
                    setCopied(false);
                  }}
                />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="productivity-tool__pane tool-workspace-panel base-converter-tool__result-pane">
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
            "base-converter-tool__result",
            !result.ok && "base-converter-tool__result--muted",
          )}
          aria-live="polite"
        >
          {result.ok ? liveOutput : labels.emptyHint}
        </p>

        {binaryPreview ? (
          <p className="base-converter-tool__binary-preview">
            <span className="base-converter-tool__binary-label">{labels.bitwiseBinaryLabel}</span>{" "}
            <code>{binaryPreview}</code>
          </p>
        ) : null}

        {copyError ? <p className="base-converter-tool__error">{copyError}</p> : null}
        <p className="base-converter-tool__privacy">{labels.privacyLabel}</p>
      </section>

      {hasConverted ? (
        <ToolSuccessEngagement pageTitle={labels.pageTitle} className="base-converter-tool__engagement" />
      ) : null}
    </div>
  );
}
