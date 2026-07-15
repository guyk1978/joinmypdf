"use client";

import { clsx } from "clsx";
import { Eraser, ScanFace, Undo2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { imBtnCta } from "@/lib/design-system";
import {
  canvasToBlob,
  createRegionId,
  detectFacesOnCanvas,
  downloadBlob,
  getCanvasPointer,
  isAcceptedImageFile,
  isFaceDetectorSupported,
  loadRedactImage,
  normalizeRect,
  redrawWithRegions,
  redactImageOutputName,
  type RedactMode,
  type RedactRect,
  type RedactRegion,
} from "@/lib/image-blur-redact";

export type ImageBlurRedactLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  instructions: string;
  modeBlur: string;
  modePixelate: string;
  modeSolid: string;
  intensityLabel: string;
  applyRegion: string;
  cancelSelection: string;
  undo: string;
  clearAll: string;
  replaceImage: string;
  processDownload: string;
  processing: string;
  autoDetectFaces: string;
  autoDetectBusy: string;
  autoDetectUnsupported: string;
  autoDetectNone: string;
  autoDetectDone: string;
  privacyLabel: string;
  regionsCount: string;
  invalidFile: string;
  errorEmptySelection: string;
  errorGeneric: string;
  pageTitle: string;
};

type ImageBlurRedactProps = {
  labels: ImageBlurRedactLabels;
  className?: string;
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

type DraftSelection = {
  start: { x: number; y: number };
  current: { x: number; y: number };
};

function rectToStyle(rect: RedactRect, canvasW: number, canvasH: number): CSSProperties {
  return {
    left: `${(rect.x / canvasW) * 100}%`,
    top: `${(rect.y / canvasH) * 100}%`,
    width: `${(rect.width / canvasW) * 100}%`,
    height: `${(rect.height / canvasH) * 100}%`,
  };
}

export function ImageBlurRedact({ labels, className }: ImageBlurRedactProps) {
  const intensityId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [ready, setReady] = useState(false);
  const [regions, setRegions] = useState<RedactRegion[]>([]);
  const [draft, setDraft] = useState<DraftSelection | null>(null);
  const [selection, setSelection] = useState<RedactRect | null>(null);
  const [mode, setMode] = useState<RedactMode>("blur");
  const [intensity, setIntensity] = useState(10);
  const [busy, setBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [faceApiAvailable] = useState(() => isFaceDetectorSupported());

  const revoke = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    sourceRef.current = null;
  }, []);

  useEffect(() => () => revoke(), [revoke]);

  const paint = useCallback(
    (
      nextRegions: RedactRegion[],
      previewRect: RedactRect | null,
      previewMode: RedactMode,
      previewIntensity: number,
    ) => {
      const canvas = canvasRef.current;
      const source = sourceRef.current;
      if (!canvas || !source) return;
      redrawWithRegions(
        canvas,
        source,
        nextRegions,
        previewRect && previewRect.width >= 2 && previewRect.height >= 2
          ? { ...previewRect, mode: previewMode, intensity: previewIntensity }
          : null,
      );
    },
    [],
  );

  useEffect(() => {
    if (!ready) return;
    paint(regions, selection, mode, intensity);
  }, [ready, regions, selection, mode, intensity, paint]);

  const reset = useCallback(() => {
    revoke();
    setSourceFile(null);
    setReady(false);
    setRegions([]);
    setDraft(null);
    setSelection(null);
    setError(null);
    setNote(null);
    setCompleted(false);
    setBusy(false);
    setDetecting(false);
  }, [revoke]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedImageFile(file)) {
        setError(labels.invalidFile);
        return;
      }
      setError(null);
      setNote(null);
      setCompleted(false);
      revoke();

      try {
        const loaded = await loadRedactImage(file);
        objectUrlRef.current = loaded.objectUrl;
        sourceRef.current = loaded.image;
        setSourceFile(file);
        setRegions([]);
        setDraft(null);
        setSelection(null);
        setCanvasSize({ width: loaded.width, height: loaded.height });
        setReady(true);
        requestAnimationFrame(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          redrawWithRegions(canvas, loaded.image, []);
        });
      } catch {
        setError(labels.invalidFile);
        setReady(false);
      }
    },
    [labels.invalidFile, revoke],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!ready || busy || detecting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    const point = getCanvasPointer(canvas, event);
    setSelection(null);
    setDraft({ start: point, current: point });
    setNote(null);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!draft) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDraft({ ...draft, current: getCanvasPointer(canvas, event) });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!draft) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    const rect = normalizeRect(draft.start, getCanvasPointer(canvas, event));
    setDraft(null);
    if (rect.width < 4 || rect.height < 4) {
      setSelection(null);
      return;
    }
    setSelection(rect);
  };

  const commitSelection = () => {
    if (!selection) return;
    setRegions((prev) => [
      ...prev,
      {
        id: createRegionId(),
        ...selection,
        mode,
        intensity: mode === "solid" ? 0 : intensity,
      },
    ]);
    setSelection(null);
  };

  const handleDetectFaces = async () => {
    const canvas = canvasRef.current;
    const source = sourceRef.current;
    if (!canvas || !source || detecting || busy) return;

    if (!faceApiAvailable) {
      setNote(labels.autoDetectUnsupported);
      return;
    }

    setDetecting(true);
    setError(null);
    setNote(null);

    try {
      const probe = document.createElement("canvas");
      probe.width = canvas.width;
      probe.height = canvas.height;
      redrawWithRegions(probe, source, []);
      const faces = await detectFacesOnCanvas(probe);
      if (!faces.length) {
        setNote(labels.autoDetectNone);
        return;
      }
      setRegions((prev) => [
        ...prev,
        ...faces.map((face) => ({
          id: createRegionId(),
          ...face,
          mode: "blur" as const,
          intensity: Math.max(8, intensity),
        })),
      ]);
      setSelection(null);
      setNote(labels.autoDetectDone.replace("{count}", String(faces.length)));
    } catch {
      setNote(labels.autoDetectUnsupported);
    } finally {
      setDetecting(false);
    }
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceFile || busy) return;

    const exportRegions = selection
      ? [
          ...regions,
          {
            id: createRegionId(),
            ...selection,
            mode,
            intensity: mode === "solid" ? 0 : intensity,
          },
        ]
      : regions;

    if (exportRegions.length === 0) {
      setError(labels.errorEmptySelection);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (selection) {
        setRegions(exportRegions);
        setSelection(null);
      }
      paint(exportRegions, null, mode, intensity);
      const blob = await canvasToBlob(canvas, sourceFile);
      downloadBlob(blob, redactImageOutputName(sourceFile.name, blob.type));
      setCompleted(true);
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const draftRect = draft ? normalizeRect(draft.start, draft.current) : null;

  return (
    <div className={clsx("image-blur-redact", className)}>
      {!ready ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["JPG", "PNG", "WEBP", "GIF", "HEIC"]}
          accept={ACCEPT}
          onFiles={(files) => {
            const file = Array.from(files)[0];
            if (file) void loadFile(file);
          }}
        />
      ) : (
        <div className="image-blur-redact__workspace">
          <p className="image-blur-redact__instructions">{labels.instructions}</p>

          <div className="image-blur-redact__toolbar-row">
            <button
              type="button"
              className="image-blur-redact__ghost-btn"
              onClick={() => {
                setRegions((prev) => prev.slice(0, -1));
                setSelection(null);
              }}
              disabled={busy || detecting || regions.length === 0}
            >
              <Undo2 aria-hidden strokeWidth={2} />
              <span>{labels.undo}</span>
            </button>
            <button
              type="button"
              className="image-blur-redact__ghost-btn"
              onClick={() => {
                setRegions([]);
                setSelection(null);
                setNote(null);
              }}
              disabled={busy || detecting || (regions.length === 0 && !selection)}
            >
              <Eraser aria-hidden strokeWidth={2} />
              <span>{labels.clearAll}</span>
            </button>
            <button
              type="button"
              className="image-blur-redact__ghost-btn"
              onClick={() => void handleDetectFaces()}
              disabled={busy || detecting}
              title={!faceApiAvailable ? labels.autoDetectUnsupported : undefined}
            >
              <ScanFace aria-hidden strokeWidth={2} />
              <span>{detecting ? labels.autoDetectBusy : labels.autoDetectFaces}</span>
            </button>
            <button
              type="button"
              className="image-blur-redact__ghost-btn"
              onClick={reset}
              disabled={busy || detecting}
            >
              {labels.replaceImage}
            </button>
          </div>

          <div className="image-blur-redact__stage">
            <div className="image-blur-redact__canvas-wrap">
              <canvas
                ref={canvasRef}
                className="image-blur-redact__canvas"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />

              {draftRect ? (
                <div
                  className="image-blur-redact__marquee"
                  style={rectToStyle(draftRect, canvasSize.width, canvasSize.height)}
                />
              ) : null}

              {selection ? (
                <div
                  className="image-blur-redact__marquee image-blur-redact__marquee--active"
                  style={rectToStyle(selection, canvasSize.width, canvasSize.height)}
                />
              ) : null}

              {selection ? (
                <div
                  className="image-blur-redact__float"
                  style={{
                    left: `${((selection.x + selection.width / 2) / canvasSize.width) * 100}%`,
                    top: `${(selection.y / canvasSize.height) * 100}%`,
                  }}
                  role="toolbar"
                  aria-label={labels.applyRegion}
                >
                  <div className="image-blur-redact__mode-row">
                    {(
                      [
                        ["blur", labels.modeBlur],
                        ["pixelate", labels.modePixelate],
                        ["solid", labels.modeSolid],
                      ] as const
                    ).map(([value, labelText]) => (
                      <button
                        key={value}
                        type="button"
                        className={clsx(
                          "image-blur-redact__mode-btn",
                          mode === value && "image-blur-redact__mode-btn--active",
                        )}
                        onClick={() => setMode(value)}
                      >
                        {labelText}
                      </button>
                    ))}
                  </div>
                  {mode !== "solid" ? (
                    <label className="image-blur-redact__intensity" htmlFor={intensityId}>
                      <span>{labels.intensityLabel}</span>
                      <input
                        id={intensityId}
                        type="range"
                        min={mode === "blur" ? 2 : 4}
                        max={mode === "blur" ? 20 : 40}
                        value={intensity}
                        onChange={(event) => setIntensity(Number(event.target.value))}
                      />
                    </label>
                  ) : null}
                  <div className="image-blur-redact__float-actions">
                    <button
                      type="button"
                      className="image-blur-redact__ghost-btn"
                      onClick={() => setSelection(null)}
                    >
                      {labels.cancelSelection}
                    </button>
                    <button
                      type="button"
                      className="image-blur-redact__apply-btn"
                      onClick={commitSelection}
                    >
                      {labels.applyRegion}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <p className="image-blur-redact__meta">
            {labels.regionsCount.replace("{count}", String(regions.length))}
          </p>

          <div className="image-blur-redact__actions">
            <button
              type="button"
              className={clsx(imBtnCta, "image-blur-redact__primary-btn")}
              onClick={() => void handleDownload()}
              disabled={busy || detecting || (regions.length === 0 && !selection)}
            >
              {busy ? labels.processing : labels.processDownload}
            </button>
          </div>

          {note ? <p className="image-blur-redact__note">{note}</p> : null}
          <p className="image-blur-redact__privacy">{labels.privacyLabel}</p>

          {completed ? (
            <ToolSuccessEngagement
              pageTitle={labels.pageTitle}
              className="image-blur-redact__engagement"
            />
          ) : null}
        </div>
      )}

      {error ? (
        <p className="image-blur-redact__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
