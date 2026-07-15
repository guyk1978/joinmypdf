"use client";

import { clsx } from "clsx";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { Magnifier } from "@/components/Magnifier";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
} from "react";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PngToIcoSizePreview } from "@/components/PngToIcoSizePreview";
import { PngToIcoHeaderCode } from "@/components/PngToIcoHeaderCode";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { imBtnCta } from "@/lib/design-system";
import {
  convertPngImageToIco,
  convertPngFilesToIco,
  downloadBlob,
  isAcceptedPngFile,
  loadPngFileForPreview,
  pngToIcoBatchDownloadName,
  pngToIcoOutputName,
  pngToIcoZip,
} from "@/lib/png-to-ico";

export type PngToIcoLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  convertInstructions: string;
  batchInstructions: string;
  batchFileCount: (count: number) => string;
  batchStatusPending: string;
  batchStatusProcessing: string;
  batchStatusDone: string;
  batchStatusError: string;
  batchProgress: (current: number, total: number) => string;
  downloadAll: string;
  formatFileInfo: (name: string, width: number, height: number) => string;
  sizePreviewTitle: string;
  sizePreviewHint: string;
  sizePreviewSize: (size: number) => string;
  downloadIco: string;
  converting: string;
  convertingProgress: string;
  invalidFile: string;
  invalidBatchFiles: (count: number) => string;
  convertFailed: string;
  replaceImage: string;
  clearBatch: string;
  maintainAspectRatioWithPadding: string;
  maintainAspectRatioWithPaddingHint: string;
  localProcessingActive: string;
  localProcessingComplete: string;
  headerCodeTitle: string;
  headerCodeHint: string;
  iconPathLabel: string;
  iconPathPlaceholder: string;
  copyHtmlCode: string;
  copiedHtmlCode: string;
  copyHtmlCodeFailed: string;
};

export type PngToIcoProps = {
  labels: PngToIcoLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT = "image/png,.png";

type LocalProcessingStatus = "idle" | "processing" | "success";
type BatchItemStatus = "pending" | "processing" | "done" | "error";

type BatchItem = {
  id: string;
  file: File;
  status: BatchItemStatus;
  outputName?: string;
  blob?: Blob;
};

function createBatchId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function collectPngFiles(fileList: FileList | File[]): File[] {
  return Array.from(fileList).filter(isAcceptedPngFile);
}

export function PngToIco({ labels, className, onDownload }: PngToIcoProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const batchRunRef = useRef(0);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [maintainAspectRatioWithPadding, setMaintainAspectRatioWithPadding] = useState(true);
  const [localProcessingStatus, setLocalProcessingStatus] = useState<LocalProcessingStatus>("idle");
  const [headerCodeFilename, setHeaderCodeFilename] = useState<string | null>(null);

  const headerCodeLabels = {
    title: labels.headerCodeTitle,
    hint: labels.headerCodeHint,
    iconPathLabel: labels.iconPathLabel,
    iconPathPlaceholder: labels.iconPathPlaceholder,
    copyHtmlCode: labels.copyHtmlCode,
    copiedHtmlCode: labels.copiedHtmlCode,
    copyHtmlCodeFailed: labels.copyHtmlCodeFailed,
  };

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl();
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, [revokeObjectUrl]);

  const reset = useCallback(() => {
    batchRunRef.current += 1;
    revokeObjectUrl();
    setSourceFile(null);
    setImageSrc(null);
    setNaturalSize(null);
    setBatchItems([]);
    setBatchBusy(false);
    setBatchProgress({ current: 0, total: 0 });
    setProgress(0);
    setError("");
    setLocalProcessingStatus("idle");
    setHeaderCodeFilename(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedPngFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      batchRunRef.current += 1;
      setBatchItems([]);
      setBatchBusy(false);
      setError("");
      setProgress(0);
      setLocalProcessingStatus("idle");
      setHeaderCodeFilename(null);
      revokeObjectUrl();

      try {
        const url = await loadPngFileForPreview(file);
        objectUrlRef.current = url;
        setSourceFile(file);
        setImageSrc(url);
        setNaturalSize(null);
      } catch {
        setError(labels.invalidFile);
      }
    },
    [labels.invalidFile, revokeObjectUrl],
  );

  const runBatchConversion = useCallback(
    async (files: File[]) => {
      const runId = batchRunRef.current + 1;
      batchRunRef.current = runId;

      const items: BatchItem[] = files.map((file) => ({
        id: createBatchId(),
        file,
        status: "pending",
      }));

      setSourceFile(null);
      setImageSrc(null);
      setNaturalSize(null);
      revokeObjectUrl();
      setBatchItems(items);
      setBatchBusy(true);
      setBatchProgress({ current: 0, total: files.length });
      setError("");
      setLocalProcessingStatus("processing");

      const options = { maintainAspectRatioWithPadding };
      let doneCount = 0;

      try {
        await convertPngFilesToIco(files, options, (update) => {
          if (batchRunRef.current !== runId) return;

          if (update.status === "processing") {
            setBatchItems((current) =>
              current.map((item, index) =>
                index === update.index ? { ...item, status: "processing" } : item,
              ),
            );
            return;
          }

          if (update.status === "done" && update.output) {
            doneCount += 1;
            setBatchProgress({ current: doneCount, total: update.total });
            setBatchItems((current) =>
              current.map((item, index) =>
                index === update.index
                  ? {
                      ...item,
                      status: "done",
                      outputName: update.output!.fileName,
                      blob: update.output!.blob,
                    }
                  : item,
              ),
            );
            return;
          }

          setBatchItems((current) =>
            current.map((item, index) =>
              index === update.index ? { ...item, status: "error" } : item,
            ),
          );
        });

        if (batchRunRef.current !== runId) return;
        const firstOutput = files.map((file) => pngToIcoOutputName(file.name)).find(Boolean);
        if (firstOutput) setHeaderCodeFilename(firstOutput);
        setLocalProcessingStatus(doneCount > 0 ? "success" : "idle");
      } catch {
        if (batchRunRef.current !== runId) return;
        setBatchItems((current) =>
          current.map((item) =>
            item.status === "done" ? item : { ...item, status: "error" },
          ),
        );
        setLocalProcessingStatus("idle");
        setError(labels.convertFailed);
      } finally {
        if (batchRunRef.current === runId) {
          setBatchBusy(false);
          setBatchProgress({ current: doneCount, total: files.length });
        }
      }
    },
    [labels.convertFailed, maintainAspectRatioWithPadding, revokeObjectUrl],
  );

  const loadFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const pngFiles = collectPngFiles(incoming);
      const skipped = incoming.length - pngFiles.length;

      if (!pngFiles.length) {
        setError(labels.invalidFile);
        return;
      }

      if (skipped > 0) {
        setError(labels.invalidBatchFiles(skipped));
      } else {
        setError("");
      }

      if (pngFiles.length === 1) {
        void loadFile(pngFiles[0]);
        return;
      }

      void runBatchConversion(pngFiles);
    },
    [labels.invalidBatchFiles, labels.invalidFile, loadFile, runBatchConversion],
  );

  const onImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const startProgress = () => {
    setProgress(8);
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
    }
    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => (current >= 88 ? current : current + 9));
    }, 120);
  };

  const stopProgress = () => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
  };

  const handleDownloadIco = async () => {
    if (!sourceFile || !imageSrc || busy) return;

    setBusy(true);
    setError("");
    setLocalProcessingStatus("processing");
    startProgress();

    try {
      const blob = await convertPngImageToIco(imageSrc, {
        maintainAspectRatioWithPadding,
      });
      const filename = pngToIcoOutputName(sourceFile.name);
      stopProgress();
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
      setHeaderCodeFilename(filename);
      setLocalProcessingStatus("success");
    } catch {
      stopProgress();
      setProgress(0);
      setLocalProcessingStatus("idle");
      setError(labels.convertFailed);
    } finally {
      setBusy(false);
      window.setTimeout(() => setProgress(0), 600);
    }
  };

  const handleDownloadAll = async () => {
    const outputs = batchItems
      .filter((item): item is BatchItem & { blob: Blob; outputName: string } =>
        Boolean(item.blob && item.outputName),
      )
      .map((item) => ({ fileName: item.outputName, blob: item.blob }));

    if (!outputs.length || batchBusy) return;

    if (outputs.length === 1) {
      downloadBlob(outputs[0].blob, outputs[0].fileName);
      onDownload?.(outputs[0].blob, outputs[0].fileName);
      setHeaderCodeFilename(outputs[0].fileName);
      return;
    }

    setBatchBusy(true);
    setLocalProcessingStatus("processing");
    try {
      const zip = await pngToIcoZip(outputs);
      const filename = pngToIcoBatchDownloadName(outputs.length);
      downloadBlob(zip, filename);
      onDownload?.(zip, filename);
      setLocalProcessingStatus("success");
    } catch {
      setError(labels.convertFailed);
      setLocalProcessingStatus("idle");
    } finally {
      setBatchBusy(false);
    }
  };

  const batchDoneCount = batchItems.filter((item) => item.status === "done").length;
  const batchAllDone =
    batchItems.length > 0 && batchItems.every((item) => item.status === "done" || item.status === "error");
  const batchReadyForDownload = batchAllDone && batchDoneCount > 0 && !batchBusy;
  const showWorkspace = Boolean(imageSrc) || batchItems.length > 0;
  const feedbackReady = localProcessingStatus === "success" || batchReadyForDownload;
  const isBatchMode = batchItems.length > 0;

  useEffect(() => {
    if (!feedbackReady) {
      registerFile(null);
      return;
    }
    const feedbackFile = isBatchMode
      ? batchItems.find((item) => item.status === "done")?.file
      : sourceFile;
    if (feedbackFile) registerFile(feedbackFile, slug);
  }, [feedbackReady, isBatchMode, batchItems, sourceFile, slug, registerFile]);

  return (
    <div className={clsx("crop-image-tool png-to-ico-tool", className)}>
      {!showWorkspace ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["PNG"]}
          accept={ACCEPT}
          multiple
          onFiles={(files) => {
            loadFiles(files);
          }}
        />
      ) : batchItems.length > 0 ? (
        <div className="crop-image-tool__workspace png-to-ico-tool__batch-workspace">
          <p className="crop-image-tool__instructions">{labels.batchInstructions}</p>
          <p className="crop-image-tool__meta">{labels.batchFileCount(batchItems.length)}</p>

          <ul className="png-to-ico-tool__batch-list">
            {batchItems.map((item) => (
              <li key={item.id} className="png-to-ico-tool__batch-item">
                <span className="png-to-ico-tool__batch-name">{item.file.name}</span>
                <span
                  className={clsx(
                    "png-to-ico-tool__batch-status",
                    item.status === "processing" && "png-to-ico-tool__batch-status--processing",
                    item.status === "done" && "png-to-ico-tool__batch-status--done",
                    item.status === "error" && "png-to-ico-tool__batch-status--error",
                  )}
                >
                  {item.status === "processing" ? (
                    <>
                      <Loader2 className="png-to-ico-tool__batch-status-icon png-to-ico-tool__local-badge-icon--spin" aria-hidden />
                      {labels.batchStatusProcessing}
                    </>
                  ) : item.status === "done" ? (
                    <>
                      <CheckCircle2 className="png-to-ico-tool__batch-status-icon" aria-hidden />
                      {labels.batchStatusDone}
                    </>
                  ) : item.status === "error" ? (
                    <>
                      <AlertCircle className="png-to-ico-tool__batch-status-icon" aria-hidden />
                      {labels.batchStatusError}
                    </>
                  ) : (
                    labels.batchStatusPending
                  )}
                </span>
              </li>
            ))}
          </ul>

          <label className="crop-image-tool__checkbox">
            <input
              type="checkbox"
              checked={maintainAspectRatioWithPadding}
              onChange={(event) => setMaintainAspectRatioWithPadding(event.target.checked)}
              disabled={batchBusy}
            />
            <span>{labels.maintainAspectRatioWithPadding}</span>
          </label>
          <p className="crop-image-tool__meta png-to-ico-tool__padding-hint">
            {labels.maintainAspectRatioWithPaddingHint}
          </p>

          {localProcessingStatus !== "idle" ? (
            <p
              className={clsx(
                "png-to-ico-tool__local-badge",
                localProcessingStatus === "processing" &&
                  "png-to-ico-tool__local-badge--processing",
                localProcessingStatus === "success" && "png-to-ico-tool__local-badge--success",
              )}
              role="status"
              aria-live="polite"
            >
              {localProcessingStatus === "processing" ? (
                <>
                  <Loader2
                    className="png-to-ico-tool__local-badge-icon png-to-ico-tool__local-badge-icon--spin"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{labels.localProcessingActive}</span>
                </>
              ) : (
                <>
                  <CheckCircle2
                    className="png-to-ico-tool__local-badge-icon"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{labels.localProcessingComplete}</span>
                </>
              )}
            </p>
          ) : null}

          {batchBusy && batchProgress.total > 0 ? (
            <WorkspaceProgressBar
              percent={Math.round((batchProgress.current / batchProgress.total) * 100)}
              label={labels.batchProgress(batchProgress.current, batchProgress.total)}
            />
          ) : null}

          {headerCodeFilename && localProcessingStatus === "success" ? (
            <PngToIcoHeaderCode outputFilename={headerCodeFilename} labels={headerCodeLabels} />
          ) : null}

          {feedbackReady ? <ToolSuccessEngagement pageTitle={headline} /> : null}

          <div className="crop-image-tool__actions">
            <button
              type="button"
              className="crop-image-tool__secondary-btn"
              onClick={reset}
              disabled={batchBusy}
            >
              {labels.clearBatch}
            </button>
            {batchReadyForDownload ? (
              <button
                type="button"
                className={clsx(imBtnCta, "crop-image-tool__primary-btn")}
                onClick={() => void handleDownloadAll()}
              >
                {labels.downloadAll}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="crop-image-tool__workspace">
          <p className="crop-image-tool__instructions">{labels.convertInstructions}</p>

          <Magnifier zoom={2} size={160} shape="rounded">
          <div className="crop-image-tool__stage crop-image-tool__stage--preview">
            <img
              src={imageSrc!}
              alt=""
              className="crop-image-tool__img"
              draggable={false}
              onLoad={onImageLoad}
            />
          </div>
          </Magnifier>

          {naturalSize && imageSrc ? (
            <PngToIcoSizePreview
              imageSrc={imageSrc}
              naturalSize={naturalSize}
              letterboxPadding={maintainAspectRatioWithPadding}
              labels={{
                title: labels.sizePreviewTitle,
                hint: labels.sizePreviewHint,
                sizeLabel: labels.sizePreviewSize,
              }}
            />
          ) : null}

          {sourceFile && naturalSize ? (
            <p className="crop-image-tool__meta">
              {labels.formatFileInfo(sourceFile.name, naturalSize.width, naturalSize.height)}
            </p>
          ) : null}

          <label className="crop-image-tool__checkbox">
            <input
              type="checkbox"
              checked={maintainAspectRatioWithPadding}
              onChange={(event) => setMaintainAspectRatioWithPadding(event.target.checked)}
              disabled={busy}
            />
            <span>{labels.maintainAspectRatioWithPadding}</span>
          </label>
          <p className="crop-image-tool__meta png-to-ico-tool__padding-hint">
            {labels.maintainAspectRatioWithPaddingHint}
          </p>

          {localProcessingStatus !== "idle" ? (
            <p
              className={clsx(
                "png-to-ico-tool__local-badge",
                localProcessingStatus === "processing" &&
                  "png-to-ico-tool__local-badge--processing",
                localProcessingStatus === "success" && "png-to-ico-tool__local-badge--success",
              )}
              role="status"
              aria-live="polite"
            >
              {localProcessingStatus === "processing" ? (
                <>
                  <Loader2
                    className="png-to-ico-tool__local-badge-icon png-to-ico-tool__local-badge-icon--spin"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{labels.localProcessingActive}</span>
                </>
              ) : (
                <>
                  <CheckCircle2
                    className="png-to-ico-tool__local-badge-icon"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{labels.localProcessingComplete}</span>
                </>
              )}
            </p>
          ) : null}

          {busy ? (
            <WorkspaceProgressBar percent={progress} label={labels.convertingProgress} />
          ) : null}

          {headerCodeFilename && localProcessingStatus === "success" ? (
            <PngToIcoHeaderCode outputFilename={headerCodeFilename} labels={headerCodeLabels} />
          ) : null}

          {feedbackReady ? <ToolSuccessEngagement pageTitle={headline} /> : null}

          <div className="crop-image-tool__actions">
            <button
              type="button"
              className="crop-image-tool__secondary-btn"
              onClick={reset}
              disabled={busy}
            >
              {labels.replaceImage}
            </button>
            <button
              type="button"
              className={clsx(imBtnCta, "crop-image-tool__primary-btn")}
              onClick={() => void handleDownloadIco()}
              disabled={busy || !naturalSize}
            >
              {busy ? labels.converting : labels.downloadIco}
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
