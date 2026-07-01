"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  decodeBase64ToText,
  encodeFileToBase64,
  encodeTextToBase64,
} from "@/lib/base64-encoder-decoder";

export type Base64EncoderDecoderLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  outputLabel: string;
  encodeButton: string;
  decodeButton: string;
  uploadButton: string;
  uploadAria: string;
  uploadedFile: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
};

type Base64EncoderDecoderProps = {
  labels: Base64EncoderDecoderLabels;
  className?: string;
};

export function Base64EncoderDecoder({ labels, className }: Base64EncoderDecoderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onEncode = () => {
    const result = encodeTextToBase64(input);
    if (result.ok) {
      setOutput(result.result);
      setError(null);
      setUploadedFileName(null);
      return;
    }

    setError(result.error);
  };

  const onDecode = () => {
    const result = decodeBase64ToText(input);
    if (result.ok) {
      setOutput(result.result);
      setError(null);
      setUploadedFileName(null);
      return;
    }

    setError(result.error);
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

  const onUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    const result = await encodeFileToBase64(file);
    setUploading(false);

    if (result.ok) {
      setInput("");
      setOutput(result.result);
      setUploadedFileName(result.fileName);
      setError(null);
      return;
    }

    setError(result.error);
  };

  return (
    <div className={clsx("base64-tool", className)}>
      <div className="base64-tool__workspace">
        <div className="base64-tool__input tool-workspace-panel">
          <label htmlFor={inputId} className="base64-tool__label">
            {labels.inputLabel}
          </label>
          <textarea
            id={inputId}
            className="base64-tool__textarea"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setUploadedFileName(null);
            }}
            placeholder={labels.inputPlaceholder}
            spellCheck={false}
            rows={14}
          />

          <div className="base64-tool__controls">
            <button type="button" className="base64-tool__action-btn" onClick={onEncode} disabled={!input}>
              {labels.encodeButton}
            </button>
            <button type="button" className="base64-tool__action-btn" onClick={onDecode} disabled={!input}>
              {labels.decodeButton}
            </button>
            <button
              type="button"
              className="base64-tool__upload-btn"
              onClick={onUploadClick}
              disabled={uploading}
            >
              {labels.uploadButton}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="base64-tool__file-input"
              aria-label={labels.uploadAria}
              onChange={(event) => void onFileChange(event)}
            />
          </div>
        </div>

        <div className="base64-tool__output tool-workspace-panel">
          <div className="base64-tool__output-header">
            <span className="base64-tool__label">{labels.outputLabel}</span>
            <button
              type="button"
              className={clsx("base64-tool__copy-btn", copied && "base64-tool__copy-btn--copied")}
              onClick={() => void onCopy()}
              disabled={!output}
            >
              {copied ? labels.copied : labels.copyButton}
            </button>
          </div>

          {uploadedFileName ? (
            <p className="base64-tool__file-note">
              {labels.uploadedFile.replace("{fileName}", uploadedFileName)}
            </p>
          ) : null}

          <pre className="base64-tool__code" aria-live="polite">
            {output || "\u00a0"}
          </pre>
        </div>
      </div>

      {error ? (
        <p className="base64-tool__error" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
