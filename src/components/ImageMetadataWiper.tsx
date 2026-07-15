"use client";

import { useCallback, useId, useRef, useState } from "react";
import { clsx } from "clsx";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { Magnifier } from "@/components/Magnifier";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import {
  imageMetadataWiperOutputName,
  inspectImageMetadata,
  isPrivacyWiperImageFile,
  wipeImageMetadata,
  type MetadataFinding,
  type MetadataFindingId,
} from "@/lib/image-metadata-wiper";

export type ImageMetadataWiperLabels = {
  dropTitle: string;
  selectLabel: string;
  dropHint: string;
  privacyLabel: string;
  findingsTitle: string;
  noMetadata: string;
  wiping: string;
  inspecting: string;
  wipeButton: string;
  clearButton: string;
  errorUnsupported: string;
  errorEmpty: string;
  errorGeneric: string;
  successHint: string;
  pageTitle: string;
  findingLabels: Record<MetadataFindingId, string>;
};

type ImageMetadataWiperProps = {
  labels: ImageMetadataWiperLabels;
  className?: string;
};

const ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function ImageMetadataWiper({ labels, className }: ImageMetadataWiperProps) {
  const statusId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [findings, setFindings] = useState<MetadataFinding[]>([]);
  const [inspected, setInspected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const previewRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setFindings([]);
    setInspected(false);
    setBusy(false);
    setStatus(null);
    setError(null);
    setCompleted(false);
    revokePreview();
  }, [revokePreview]);

  const loadFile = async (next: File) => {
    if (!isPrivacyWiperImageFile(next)) {
      setError(labels.errorUnsupported);
      return;
    }
    if (next.size === 0) {
      setError(labels.errorEmpty);
      return;
    }

    revokePreview();
    const url = URL.createObjectURL(next);
    previewRef.current = url;
    setPreviewUrl(url);
    setFile(next);
    setFindings([]);
    setInspected(false);
    setCompleted(false);
    setError(null);
    setBusy(true);
    setStatus(labels.inspecting);

    try {
      const result = await inspectImageMetadata(next);
      setFindings(result.findings);
      setInspected(true);
      setStatus(null);
    } catch {
      setError(labels.errorGeneric);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  const onFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming || []);
    const accepted = list.find(isPrivacyWiperImageFile) ?? list[0];
    if (!accepted) {
      setError(labels.errorUnsupported);
      return;
    }
    void loadFile(accepted);
  };

  const onWipe = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setStatus(labels.wiping);
    setCompleted(false);

    try {
      const blob = await wipeImageMetadata(file);
      const name = imageMetadataWiperOutputName(file);
      downloadBlob(blob, name);
      setStatus(labels.successHint.replace("{name}", name));
      setCompleted(true);
    } catch {
      setError(labels.errorGeneric);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={clsx("image-wiper-tool", className)}>
      {!file ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectLabel}
          dropHint={labels.dropHint}
          supportedFormats={["JPG", "PNG"]}
          privacyLabel={labels.privacyLabel}
          accept={ACCEPT}
          multiple={false}
          disabled={busy}
          onFiles={onFiles}
        />
      ) : (
        <div className="image-wiper-tool__workspace tool-workspace-panel security-tool__pane">
          <div className="image-wiper-tool__preview-row">
            {previewUrl ? (
              <Magnifier zoom={2} size={160} shape="rounded">
              <img
                src={previewUrl}
                alt=""
                className="image-wiper-tool__preview"
              />
              </Magnifier>
            ) : null}
            <div className="image-wiper-tool__file-meta">
              <p className="image-wiper-tool__file-name">{file.name}</p>
              <p className="security-tool__hint">{labels.privacyLabel}</p>
            </div>
          </div>

          <section className="image-wiper-tool__findings" aria-labelledby={statusId}>
            <h2 id={statusId} className="security-tool__section-title">
              {labels.findingsTitle}
            </h2>
            {inspected && findings.length === 0 ? (
              <p className="image-wiper-tool__empty">{labels.noMetadata}</p>
            ) : null}
            {findings.length > 0 ? (
              <ul className="image-wiper-tool__findings-list">
                {findings.map((finding) => (
                  <li key={`${finding.id}-${finding.detail ?? ""}`} className="image-wiper-tool__finding">
                    <span className="image-wiper-tool__finding-label">
                      {labels.findingLabels[finding.id]}
                    </span>
                    {finding.detail ? (
                      <span className="image-wiper-tool__finding-detail">{finding.detail}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <div className="image-wiper-tool__actions">
            <button
              type="button"
              className="security-tool__action-btn"
              onClick={onWipe}
              disabled={busy || !inspected}
            >
              {labels.wipeButton}
            </button>
            <button type="button" className="security-tool__copy-btn" onClick={reset} disabled={busy}>
              {labels.clearButton}
            </button>
          </div>

          {status ? <p className="image-wiper-tool__status">{status}</p> : null}
        </div>
      )}

      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {completed ? (
        <ToolSuccessEngagement
          pageTitle={labels.pageTitle}
          className="image-wiper-tool__engagement"
        />
      ) : null}
    </div>
  );
}
