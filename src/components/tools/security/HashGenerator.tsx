"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { clsx } from "clsx";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";
import {
  copyTextToClipboard,
  HASH_ALGORITHMS,
  hashFile,
  hashText,
  type HashAlgorithm,
} from "@/lib/hash-generator";

export type HashGeneratorLabels = {
  algorithmLabel: string;
  textInputLabel: string;
  textInputPlaceholder: string;
  fileDropTitle: string;
  selectFileButton: string;
  clearFileButton: string;
  hashingFile: string;
  outputLabel: string;
  outputEmpty: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  hashError: string;
  privacyLabel?: string;
};

type HashGeneratorProps = {
  labels: HashGeneratorLabels;
  className?: string;
};

export function HashGenerator({ labels, className }: HashGeneratorProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (file) {
        setBusy(true);
        try {
          const result = await hashFile(file, algorithm);
          if (!cancelled) {
            setHash(result);
            setError(null);
          }
        } catch {
          if (!cancelled) {
            setHash("");
            setError(labels.hashError);
          }
        } finally {
          if (!cancelled) setBusy(false);
        }
        return;
      }

      if (!text.trim()) {
        setHash("");
        setError(null);
        return;
      }

      try {
        const result = hashText(text, algorithm);
        if (!cancelled) {
          setHash(result);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setHash("");
          setError(labels.hashError);
        }
      }
    };

    const timer = window.setTimeout(() => {
      void run();
    }, file ? 0 : 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, file, algorithm, labels.hashError]);

  const applyFile = (nextFile: File | null) => {
    setFile(nextFile);
    setError(null);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) applyFile(dropped);
  };

  const onCopy = async () => {
    if (!hash) return;
    const success = await copyTextToClipboard(hash);
    if (!success) {
      setError(labels.copyFailed);
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={clsx("hash-generator-tool", className)}>
      <section className="security-tool__pane tool-workspace-panel">
        <div className="hash-generator-tool__field">
          <label className="security-tool__label" htmlFor="hash-algorithm">
            {labels.algorithmLabel}
          </label>
          <select
            id="hash-algorithm"
            className="security-tool__select"
            value={algorithm}
            onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}
          >
            {HASH_ALGORITHMS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <label className="security-tool__label" htmlFor={inputId}>
          {labels.textInputLabel}
        </label>
        <textarea
          id={inputId}
          className="security-tool__textarea"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (file) setFile(null);
          }}
          placeholder={labels.textInputPlaceholder}
          spellCheck={false}
          rows={6}
          disabled={Boolean(file)}
        />

        <IndustrialMatteDropzone
          active={dragActive}
          dropTitle={labels.fileDropTitle}
          selectLabel={labels.selectFileButton}
          supportsLabel={formatSupportsLabel(["Any file"])}
          privacyLabel={labels.privacyLabel}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
            setDragActive(false);
          }}
          onDrop={onDrop}
          onClick={() => {
            if (!file) fileInputRef.current?.click();
          }}
          input={
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
            />
          }
          footer={
            file ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-neutral-300">{file.name}</span>
                <button
                  type="button"
                  className="security-tool__action-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    applyFile(null);
                  }}
                >
                  {labels.clearFileButton}
                </button>
              </div>
            ) : null
          }
        />
      </section>

      <section className="security-tool__pane tool-workspace-panel">
        <div className="security-tool__pane-header">
          <span className="security-tool__label">{labels.outputLabel}</span>
          <button
            type="button"
            className={clsx("security-tool__copy-btn", copied && "security-tool__copy-btn--copied")}
            onClick={() => void onCopy()}
            disabled={!hash}
          >
            {copied ? labels.copied : labels.copyButton}
          </button>
        </div>

        {busy ? <p className="security-tool__hint">{labels.hashingFile}</p> : null}
        {error ? (
          <p className="security-tool__error" role="status">
            {error}
          </p>
        ) : null}

        <pre className="security-tool__output" aria-live="polite">
          {hash || labels.outputEmpty}
        </pre>
      </section>
    </div>
  );
}
