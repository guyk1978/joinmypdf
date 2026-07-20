"use client";

import { clsx } from "clsx";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Download,
  GripVertical,
  Loader2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { downloadBlob } from "@/lib/crop-image";
import {
  combineImages,
  imageCombinerOutputName,
  isImageCombinerFile,
  loadCombinerImage,
  type ImageCombinerLayout,
} from "@/lib/image-combiner";
import { imBtnCta } from "@/lib/design-system";

type SelectedImage = {
  id: string;
  file: File;
  url: string;
};

export type ImageCombinerLabels = {
  dropTitle: string;
  addMoreTitle: string;
  dropHint: string;
  selectFiles: string;
  selectFilesAria: string;
  selectedTitle: string;
  selectedCount: (count: number, max: number) => string;
  reorderHint: string;
  remove: string;
  moveEarlier: string;
  moveLater: string;
  settingsTitle: string;
  layoutLabel: string;
  horizontal: string;
  vertical: string;
  combine: string;
  combining: string;
  resultTitle: string;
  resultDimensions: (width: number, height: number) => string;
  downloadResult: string;
  startOver: string;
  privacyLabel: string;
  invalidFile: string;
  tooManyFiles: string;
  needMoreFiles: string;
  errorGeneric: string;
  successHint: string;
  pageTitle: string;
};

type ImageCombinerProps = {
  labels: ImageCombinerLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

const ACCEPT = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
const MIN_FILES = 2;
const MAX_FILES = 4;

function makeId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
}

export function ImageCombiner({
  labels,
  className,
  onStart,
  onComplete,
}: ImageCombinerProps) {
  const objectUrlsRef = useRef(new Set<string>());
  const resultUrlRef = useRef<string | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const [images, setImages] = useState<SelectedImage[]>([]);
  const [layout, setLayout] = useState<ImageCombinerLayout>("horizontal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    width: number;
    height: number;
  } | null>(null);

  const clearResult = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
  }, []);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const candidates = Array.from(incoming);
      const accepted = candidates.filter(isImageCombinerFile);
      if (accepted.length !== candidates.length) {
        setError(labels.invalidFile);
      } else {
        setError(null);
      }

      setImages((current) => {
        const available = MAX_FILES - current.length;
        if (accepted.length > available) setError(labels.tooManyFiles);
        const additions = accepted.slice(0, available).map((file) => {
          const url = URL.createObjectURL(file);
          objectUrlsRef.current.add(url);
          return { id: makeId(file), file, url };
        });
        return [...current, ...additions];
      });
      clearResult();
    },
    [clearResult, labels.invalidFile, labels.tooManyFiles],
  );

  const removeImage = useCallback(
    (index: number) => {
      setImages((current) => {
        const removed = current[index];
        if (removed) {
          URL.revokeObjectURL(removed.url);
          objectUrlsRef.current.delete(removed.url);
        }
        return current.filter((_, itemIndex) => itemIndex !== index);
      });
      clearResult();
      setError(null);
    },
    [clearResult],
  );

  const moveImage = useCallback(
    (from: number, to: number) => {
      setImages((current) => {
        if (from === to || from < 0 || to < 0 || from >= current.length || to >= current.length) {
          return current;
        }
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      clearResult();
    },
    [clearResult],
  );

  const reset = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    setImages([]);
    setLayout("horizontal");
    setError(null);
    clearResult();
  }, [clearResult]);

  const onCombine = async () => {
    if (images.length < MIN_FILES) {
      setError(labels.needMoreFiles);
      return;
    }

    setBusy(true);
    setError(null);
    clearResult();
    onStart?.();
    try {
      const loaded = await Promise.all(images.map((item) => loadCombinerImage(item.url)));
      const combined = await combineImages(loaded, layout);
      const url = URL.createObjectURL(combined.blob);
      resultUrlRef.current = url;
      setResult({ ...combined, url });
      onComplete?.();
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const countLabel = labels.selectedCount(images.length, MAX_FILES);

  return (
    <div className={clsx("space-y-6", className)}>
      {images.length < MAX_FILES ? (
        <ImageToolDropzone
          dropTitle={images.length ? labels.addMoreTitle : labels.dropTitle}
          dropHint={labels.dropHint}
          supportsLabel={labels.dropHint}
          selectLabel={labels.selectFiles}
          selectAria={labels.selectFilesAria}
          privacyLabel={labels.privacyLabel}
          accept={ACCEPT}
          multiple
          compact={images.length > 0}
          disabled={busy}
          onFiles={addFiles}
        />
      ) : null}

      {images.length ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="border border-[#262626] bg-[#111] p-4" aria-labelledby="image-combiner-selected">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id="image-combiner-selected" className="m-0 text-sm font-semibold uppercase tracking-widest text-white">
                  {labels.selectedTitle}
                </h2>
                <p className="mt-1 text-xs text-[#737373]">{labels.reorderHint}</p>
              </div>
              <span className="text-xs font-medium text-[#a3a3a3]">{countLabel}</span>
            </div>

            <ol
              className={clsx(
                "m-0 grid list-none gap-3 p-0",
                layout === "horizontal" ? "sm:grid-cols-2 xl:grid-cols-4" : "grid-cols-1",
              )}
            >
              {images.map((item, index) => (
                <li
                  key={item.id}
                  draggable={!busy}
                  onDragStart={() => {
                    dragIndexRef.current = index;
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragIndexRef.current != null) moveImage(dragIndexRef.current, index);
                    dragIndexRef.current = null;
                  }}
                  onDragEnd={() => {
                    dragIndexRef.current = null;
                  }}
                  className="group border border-[#303030] bg-[#171717] p-3"
                >
                  <div className="relative flex min-h-36 items-center justify-center overflow-hidden bg-black/40">
                    {/* Blob URLs are generated locally and cannot use Next Image optimization. */}
                    <img src={item.url} alt={item.file.name} className="max-h-52 max-w-full object-contain" />
                    <span className="absolute start-2 top-2 inline-flex items-center gap-1 bg-black/75 px-2 py-1 text-xs text-white">
                      <GripVertical className="h-3.5 w-3.5" aria-hidden />
                      {index + 1}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-xs text-[#a3a3a3]" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <div className="mt-3 flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center border border-[#303030] text-[#a3a3a3] hover:border-white hover:text-white disabled:opacity-40"
                      disabled={busy || index === 0}
                      onClick={() => moveImage(index, index - 1)}
                      aria-label={labels.moveEarlier}
                    >
                      {layout === "horizontal" ? <ArrowLeft className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center border border-[#303030] text-[#a3a3a3] hover:border-white hover:text-white disabled:opacity-40"
                      disabled={busy || index === images.length - 1}
                      onClick={() => moveImage(index, index + 1)}
                      aria-label={labels.moveLater}
                    >
                      {layout === "horizontal" ? <ArrowRight className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      className="ms-auto inline-flex h-9 w-9 items-center justify-center border border-red-900/60 text-red-400 hover:border-red-500 hover:text-red-300 disabled:opacity-40"
                      disabled={busy}
                      onClick={() => removeImage(index)}
                      aria-label={`${labels.remove}: ${item.file.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="h-fit border border-[#262626] bg-[#111] p-4">
            <h2 className="m-0 text-sm font-semibold uppercase tracking-widest text-white">
              {labels.settingsTitle}
            </h2>
            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">
              {labels.layoutLabel}
            </p>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={labels.layoutLabel}>
              {(["horizontal", "vertical"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={busy}
                  aria-pressed={layout === option}
                  className={clsx(
                    "border px-3 py-3 text-sm font-medium transition-colors",
                    layout === option
                      ? "border-white bg-white text-black"
                      : "border-[#303030] bg-[#171717] text-[#a3a3a3] hover:text-white",
                  )}
                  onClick={() => {
                    setLayout(option);
                    clearResult();
                  }}
                >
                  {option === "horizontal" ? labels.horizontal : labels.vertical}
                </button>
              ))}
            </div>

            {error ? <p className="mt-4 text-sm text-red-400" role="alert">{error}</p> : null}

            <button
              type="button"
              className={clsx(imBtnCta, "mt-5 w-full justify-center")}
              disabled={busy || images.length < MIN_FILES}
              onClick={() => void onCombine()}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {labels.combining}
                </>
              ) : (
                labels.combine
              )}
            </button>
            <p className="mt-4 text-xs leading-relaxed text-[#737373]">{labels.privacyLabel}</p>
          </aside>
        </div>
      ) : null}

      {result ? (
        <section className="border border-emerald-900/50 bg-[#111] p-4" aria-labelledby="image-combiner-result">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="image-combiner-result" className="m-0 text-sm font-semibold uppercase tracking-widest text-emerald-300">
                {labels.resultTitle}
              </h2>
              <p className="mt-1 text-xs text-[#a3a3a3]">
                {labels.resultDimensions(result.width, result.height)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={clsx(imBtnCta, "justify-center")}
                onClick={() => downloadBlob(result.blob, imageCombinerOutputName(images.map((item) => item.file)))}
              >
                <Download className="h-4 w-4" aria-hidden />
                {labels.downloadResult}
              </button>
              <button
                type="button"
                className="border border-[#303030] px-4 py-2 text-sm text-[#a3a3a3] hover:border-white hover:text-white"
                onClick={reset}
              >
                {labels.startOver}
              </button>
            </div>
          </div>
          <div className="mt-4 flex max-h-[36rem] items-center justify-center overflow-auto bg-black/40 p-3">
            <img src={result.url} alt={labels.resultTitle} className="max-h-[34rem] max-w-full object-contain" />
          </div>
          <p className="mt-3 text-sm text-emerald-300">{labels.successHint}</p>
          <ToolSuccessEngagement
            pageTitle={labels.pageTitle}
            fileContext={images.map((item) => item.file.name).join(", ")}
            className="mt-4"
          />
        </section>
      ) : null}
    </div>
  );
}
