"use client";

import { clsx } from "clsx";
import { Upload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { imBtnCta } from "@/lib/design-system";
import {
  downloadBlob,
  icoToPngOutputName,
  isAcceptedIcoFile,
  parseIcoFile,
  revokeIcoFrames,
  type IcoFrame,
} from "@/lib/ico-to-png";

export type IcoToPngLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  convertInstructions: string;
  formatFileInfo: (name: string, frameCount: number) => string;
  framesLabel: string;
  formatFrameSize: (width: number, height: number, bitCount: number) => string;
  previewLabel: string;
  downloadPng: string;
  converting: string;
  convertingProgress: string;
  invalidFile: string;
  convertFailed: string;
  replaceFile: string;
};

export type IcoToPngProps = {
  labels: IcoToPngLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT = "image/x-icon,image/vnd.microsoft.icon,.ico";

export function IcoToPng({ labels, className, onDownload }: IcoToPngProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<number | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [frames, setFrames] = useState<IcoFrame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const framesRef = useRef<IcoFrame[]>([]);
  framesRef.current = frames;

  const selectedFrame = frames.find((frame) => frame.id === selectedFrameId) ?? frames[0] ?? null;

  useEffect(() => {
    return () => {
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
      }
      revokeIcoFrames(framesRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setFrames((prev) => {
      revokeIcoFrames(prev);
      return [];
    });
    setSourceFile(null);
    setSelectedFrameId(null);
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedIcoFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      setProgress(0);
      setLoading(true);
      setFrames((prev) => {
        revokeIcoFrames(prev);
        return [];
      });

      try {
        const parsedFrames = await parseIcoFile(file);
        setSourceFile(file);
        setFrames(parsedFrames);
        setSelectedFrameId(parsedFrames[0]?.id ?? null);
      } catch {
        setError(labels.convertFailed);
        setSourceFile(null);
        setFrames([]);
        setSelectedFrameId(null);
      } finally {
        setLoading(false);
      }
    },
    [labels.convertFailed, labels.invalidFile],
  );

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  };

  const startProgress = () => {
    setProgress(12);
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
    }
    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => (current >= 90 ? current : current + 10));
    }, 100);
  };

  const stopProgress = () => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
  };

  const handleDownloadPng = async () => {
    if (!sourceFile || !selectedFrame || busy) return;

    setBusy(true);
    setError("");
    startProgress();

    try {
      const filename = icoToPngOutputName(sourceFile.name, selectedFrame.width, selectedFrame.height);
      stopProgress();
      downloadBlob(selectedFrame.pngBlob, filename);
      onDownload?.(selectedFrame.pngBlob, filename);
    } catch {
      stopProgress();
      setProgress(0);
      setError(labels.convertFailed);
    } finally {
      setBusy(false);
      window.setTimeout(() => setProgress(0), 600);
    }
  };

  const hasFrames = frames.length > 0;

  return (
    <div className={clsx("crop-image-tool ico-to-png-tool", className)}>
      {!hasFrames ? (
        <div
          className={clsx(
            "crop-image-tool__dropzone",
            dragActive && "crop-image-tool__dropzone--active",
          )}
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
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label={labels.selectFileAria}
            onChange={onInputChange}
          />

          <Upload className="crop-image-tool__dropzone-icon" strokeWidth={1.75} aria-hidden />

          <p className="crop-image-tool__dropzone-title">{labels.dropTitle}</p>
          <p className="crop-image-tool__dropzone-hint">{labels.dropHint}</p>

          <button
            type="button"
            className={clsx(imBtnCta, "crop-image-tool__select-btn")}
            onClick={() => inputRef.current?.click()}
            disabled={loading}
          >
            {labels.selectFile}
          </button>
        </div>
      ) : (
        <div className="crop-image-tool__workspace">
          <p className="crop-image-tool__instructions">{labels.convertInstructions}</p>

          {sourceFile ? (
            <p className="crop-image-tool__meta">
              {labels.formatFileInfo(sourceFile.name, frames.length)}
            </p>
          ) : null}

          <div className="ico-to-png-tool__layout">
            <div className="ico-to-png-tool__frames tool-workspace-panel">
              <p className="ico-to-png-tool__section-label">{labels.framesLabel}</p>
              <div className="ico-to-png-tool__frame-list" role="listbox" aria-label={labels.framesLabel}>
                {frames.map((frame) => {
                  const selected = frame.id === selectedFrame?.id;
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={clsx(
                        "ico-to-png-tool__frame-option",
                        selected && "ico-to-png-tool__frame-option--selected",
                      )}
                      onClick={() => setSelectedFrameId(frame.id)}
                    >
                      <img
                        src={frame.previewUrl}
                        alt=""
                        className="ico-to-png-tool__frame-thumb"
                        draggable={false}
                      />
                      <span className="ico-to-png-tool__frame-meta">
                        {labels.formatFrameSize(frame.width, frame.height, frame.bitCount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ico-to-png-tool__preview tool-workspace-panel">
              <p className="ico-to-png-tool__section-label">{labels.previewLabel}</p>
              <div className="ico-to-png-tool__preview-stage">
                {selectedFrame ? (
                  <img
                    src={selectedFrame.previewUrl}
                    alt=""
                    className="ico-to-png-tool__preview-image"
                    draggable={false}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {busy ? (
            <WorkspaceProgressBar percent={progress} label={labels.convertingProgress} />
          ) : null}

          <div className="crop-image-tool__actions">
            <button
              type="button"
              className="crop-image-tool__secondary-btn"
              onClick={reset}
              disabled={busy}
            >
              {labels.replaceFile}
            </button>
            <button
              type="button"
              className={clsx(imBtnCta, "crop-image-tool__primary-btn")}
              onClick={() => void handleDownloadPng()}
              disabled={busy || !selectedFrame}
            >
              {busy ? labels.converting : labels.downloadPng}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className="crop-image-tool__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
