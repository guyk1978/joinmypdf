"use client";

import { useId, useState } from "react";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  generatePassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type PasswordGeneratorOptions,
  type PasswordStrengthLevel,
} from "@/lib/password-generator";

export type PasswordGeneratorLabels = {
  lengthLabel: string;
  includeLowercase: string;
  includeUppercase: string;
  includeNumbers: string;
  includeSymbols: string;
  outputLabel: string;
  generateButton: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  strengthLabel: string;
  strengthWeak: string;
  strengthFair: string;
  strengthGood: string;
  strengthStrong: string;
  charsetError: string;
};

type PasswordGeneratorProps = {
  labels: PasswordGeneratorLabels;
  className?: string;
};

const STRENGTH_LABEL_KEYS: Record<PasswordStrengthLevel, keyof PasswordGeneratorLabels> = {
  weak: "strengthWeak",
  fair: "strengthFair",
  good: "strengthGood",
  strong: "strengthStrong",
};

export function PasswordGenerator({ labels, className }: PasswordGeneratorProps) {
  const lengthId = useId();
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  const initial = generatePassword({
    length: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  const [password, setPassword] = useState(initial.ok ? initial.password : "");
  const [strengthPercent, setStrengthPercent] = useState(initial.ok ? initial.strength.percent : 0);
  const [strengthLevel, setStrengthLevel] = useState<PasswordStrengthLevel>(
    initial.ok ? initial.strength.level : "weak",
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runGenerate = () => {
    const result = generatePassword(options);
    if (!result.ok) {
      setError(labels.charsetError);
      setPassword("");
      setStrengthPercent(0);
      return;
    }

    setPassword(result.password);
    setStrengthPercent(result.strength.percent);
    setStrengthLevel(result.strength.level);
    setError(null);
  };

  const onCopy = async () => {
    if (!password) return;
    const success = await copyTextToClipboard(password);
    if (!success) {
      setError(labels.copyFailed);
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={clsx("password-generator-tool", className)}>
      <section className="security-tool__pane tool-workspace-panel">
        <h2 className="security-tool__section-title">{labels.lengthLabel}</h2>

        <div className="password-generator-tool__length-row">
          <input
            id={lengthId}
            type="range"
            className="password-generator-tool__range"
            min={PASSWORD_MIN_LENGTH}
            max={PASSWORD_MAX_LENGTH}
            value={options.length}
            onChange={(event) =>
              setOptions((current) => ({ ...current, length: Number(event.target.value) }))
            }
          />
          <span className="password-generator-tool__length-value">{options.length}</span>
        </div>

        <div className="password-generator-tool__checks">
          {(
            [
              ["includeLowercase", "includeLowercase"],
              ["includeUppercase", "includeUppercase"],
              ["includeNumbers", "includeNumbers"],
              ["includeSymbols", "includeSymbols"],
            ] as const
          ).map(([key, labelKey]) => (
            <label key={key} className="password-generator-tool__check">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(event) =>
                  setOptions((current) => ({ ...current, [key]: event.target.checked }))
                }
              />
              <span>{labels[labelKey]}</span>
            </label>
          ))}
        </div>

        <button type="button" className="security-tool__action-btn" onClick={runGenerate}>
          {labels.generateButton}
        </button>
      </section>

      <section className="security-tool__pane tool-workspace-panel">
        <div className="security-tool__pane-header">
          <span className="security-tool__label">{labels.outputLabel}</span>
          <button
            type="button"
            className={clsx("security-tool__copy-btn", copied && "security-tool__copy-btn--copied")}
            onClick={() => void onCopy()}
            disabled={!password}
          >
            {copied ? labels.copied : labels.copyButton}
          </button>
        </div>

        <output className="password-generator-tool__output" aria-live="polite">
          {password || "—"}
        </output>

        <div className="password-generator-tool__strength">
          <div className="password-generator-tool__strength-header">
            <span className="security-tool__label">{labels.strengthLabel}</span>
            <span
              className={clsx(
                "password-generator-tool__strength-text",
                `password-generator-tool__strength-text--${strengthLevel}`,
              )}
            >
              {labels[STRENGTH_LABEL_KEYS[strengthLevel]]}
            </span>
          </div>
          <div className="password-generator-tool__strength-track" aria-hidden>
            <div
              className={clsx(
                "password-generator-tool__strength-bar",
                `password-generator-tool__strength-bar--${strengthLevel}`,
              )}
              style={{ width: `${strengthPercent}%` }}
            />
          </div>
        </div>

        {error ? (
          <p className="security-tool__error" role="status">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
