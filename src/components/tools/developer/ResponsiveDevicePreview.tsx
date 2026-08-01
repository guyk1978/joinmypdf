"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { clsx } from "clsx";
import {
  AlertTriangle,
  Monitor,
  RotateCw,
  Smartphone,
  Tablet,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { openPdfDocument, type PdfJsDocument } from "@/lib/pdf-reader";
import {
  clampZoom,
  DEVICE_PRESET_ORDER,
  formatViewportLabel,
  inspectIframeDocument,
  normalizePreviewUrl,
  probeUrlFrameEmbedding,
  resolveViewportSize,
  SAMPLE_HTML,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type DeviceOrientation,
  type DevicePresetId,
  type PreviewSourceMode,
} from "@/lib/responsive-device-preview";

export type ResponsiveDevicePreviewLabels = {
  privacyLabel: string;
  sourceTitle: string;
  modePdf: string;
  modeUrl: string;
  modeHtml: string;
  pdfDropTitle: string;
  pdfDropHint: string;
  pdfBrowse: string;
  pdfClear: string;
  pdfLoading: string;
  pdfError: string;
  pdfPageLabel: string;
  urlLabel: string;
  urlPlaceholder: string;
  urlLoad: string;
  urlHint: string;
  urlBlockedHint: string;
  urlLoading: string;
  urlBlockedTitle: string;
  urlBlockedBody: string;
  urlBlockedPolicy: string;
  urlTryHtml: string;
  urlTryPdf: string;
  urlOpenExternal: string;
  htmlLabel: string;
  htmlPlaceholder: string;
  htmlApply: string;
  htmlResetSample: string;
  deviceTitle: string;
  phoneLabel: string;
  tabletLabel: string;
  desktopLabel: string;
  orientationLabel: string;
  portraitLabel: string;
  landscapeLabel: string;
  rotateLabel: string;
  zoomLabel: string;
  zoomOutLabel: string;
  zoomInLabel: string;
  zoomResetLabel: string;
  previewTitle: string;
  previewEmpty: string;
  viewportSizeLabel: string;
  frameChromeLabel: string;
  overviewTitle: string;
  overviewIntro: string;
  overviewPdfTitle: string;
  overviewPdfBody: string;
  overviewUrlTitle: string;
  overviewUrlBody: string;
  overviewHtmlTitle: string;
  overviewHtmlBody: string;
  overviewDevicesTitle: string;
  overviewDevicesBody: string;
  overviewControlsTitle: string;
  overviewControlsBody: string;
};

type ResponsiveDevicePreviewProps = {
  labels: ResponsiveDevicePreviewLabels;
  className?: string;
};

type UrlFrameStatus = "idle" | "loading" | "ready" | "blocked";

const DEVICE_ICONS = {
  phone: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
} as const;

export function ResponsiveDevicePreview({ labels, className }: ResponsiveDevicePreviewProps) {
  const fileInputId = useId();
  const urlInputId = useId();
  const htmlInputId = useId();
  const overviewId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const urlIframeRef = useRef<HTMLIFrameElement>(null);
  const pdfDocRef = useRef<PdfJsDocument | null>(null);
  const urlLoadTokenRef = useRef(0);

  const [mode, setMode] = useState<PreviewSourceMode>("html");
  const [device, setDevice] = useState<DevicePresetId>("phone");
  const [orientation, setOrientation] = useState<DeviceOrientation>("portrait");
  const [zoom, setZoom] = useState(1);

  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfDragOver, setPdfDragOver] = useState(false);

  const [urlDraft, setUrlDraft] = useState("");
  const [urlActive, setUrlActive] = useState<string | null>(null);
  const [urlFrameKey, setUrlFrameKey] = useState(0);
  const [urlFrameStatus, setUrlFrameStatus] = useState<UrlFrameStatus>("idle");
  const [urlSoftWarning, setUrlSoftWarning] = useState(false);
  const [urlProbeUnknown, setUrlProbeUnknown] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState(SAMPLE_HTML);
  const [htmlActive, setHtmlActive] = useState(SAMPLE_HTML);

  const viewport = resolveViewportSize(device, orientation);
  const deviceLabels: Record<DevicePresetId, string> = {
    phone: labels.phoneLabel,
    tablet: labels.tabletLabel,
    desktop: labels.desktopLabel,
  };

  const clearPdf = useCallback(async () => {
    const doc = pdfDocRef.current;
    pdfDocRef.current = null;
    if (doc) {
      try {
        await doc.destroy();
      } catch {
        // Ignore destroy races.
      }
    }
    setPdfName(null);
    setPdfPage(1);
    setPdfPageCount(0);
    setPdfError(null);
    const canvas = pdfCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }
  }, []);

  const loadPdfFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setPdfError(labels.pdfError);
        return;
      }

      setPdfLoading(true);
      setPdfError(null);
      await clearPdf();

      try {
        const buffer = new Uint8Array(await file.arrayBuffer());
        const doc = await openPdfDocument(buffer);
        pdfDocRef.current = doc;
        setPdfName(file.name);
        setPdfPageCount(doc.numPages);
        setPdfPage(1);
        setMode("pdf");
      } catch {
        setPdfError(labels.pdfError);
        await clearPdf();
      } finally {
        setPdfLoading(false);
      }
    },
    [clearPdf, labels.pdfError],
  );

  useEffect(() => {
    return () => {
      const doc = pdfDocRef.current;
      pdfDocRef.current = null;
      if (doc) void doc.destroy();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const doc = pdfDocRef.current;
      const canvas = pdfCanvasRef.current;
      if (!doc || !canvas || mode !== "pdf" || pdfPageCount < 1) return;

      try {
        const page = await doc.getPage(pdfPage);
        if (cancelled) return;

        const unscaled = page.getViewport({ scale: 1 });
        const fitScale = viewport.width / unscaled.width;
        const viewportPdf = page.getViewport({ scale: fitScale });
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = Math.floor(viewportPdf.width);
        canvas.height = Math.floor(viewportPdf.height);
        canvas.style.width = `${viewportPdf.width}px`;
        canvas.style.height = `${viewportPdf.height}px`;

        await page.render({
          canvasContext: ctx,
          viewport: viewportPdf,
          canvas,
        } as never).promise;
      } catch {
        if (!cancelled) setPdfError(labels.pdfError);
      }
    };

    void render();
    return () => {
      cancelled = true;
    };
  }, [labels.pdfError, mode, pdfPage, pdfPageCount, viewport.width]);

  const markUrlBlocked = useCallback((token: number) => {
    if (token !== urlLoadTokenRef.current) return;
    setUrlFrameStatus("blocked");
  }, []);

  const applyUrl = useCallback(async () => {
    const normalized = normalizePreviewUrl(urlDraft);
    if (!normalized) {
      setUrlActive(null);
      setUrlFrameStatus("idle");
      return;
    }

    const token = urlLoadTokenRef.current + 1;
    urlLoadTokenRef.current = token;
    setUrlActive(normalized);
    setUrlFrameKey((key) => key + 1);
    setUrlFrameStatus("loading");
    setUrlSoftWarning(false);
    setUrlProbeUnknown(false);
    setMode("url");

    const probe = await probeUrlFrameEmbedding(normalized);
    if (token !== urlLoadTokenRef.current) return;
    if (probe === "blocked") {
      setUrlFrameStatus("blocked");
    } else if (probe === "unknown") {
      setUrlProbeUnknown(true);
    }
  }, [urlDraft]);

  const onUrlIframeLoad = useCallback(() => {
    const token = urlLoadTokenRef.current;
    window.setTimeout(() => {
      if (token !== urlLoadTokenRef.current) return;
      const inspection = inspectIframeDocument(urlIframeRef.current);
      if (inspection === "empty") {
        markUrlBlocked(token);
        setUrlSoftWarning(false);
        return;
      }
      if (inspection === "opaque" && urlProbeUnknown) {
        // Could not read framing headers and cannot inspect cross-origin content.
        setUrlSoftWarning(true);
      }
      setUrlFrameStatus((current) => (current === "blocked" ? "blocked" : "ready"));
    }, 700);

    // If load never settles into ready/blocked, treat as blocked (hung / blank frame).
    window.setTimeout(() => {
      if (token !== urlLoadTokenRef.current) return;
      setUrlFrameStatus((current) => {
        if (current === "loading") {
          setUrlSoftWarning(false);
          return "blocked";
        }
        return current;
      });
    }, 8000);
  }, [markUrlBlocked, urlProbeUnknown]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    void loadPdfFile(file);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setPdfDragOver(false);
    const file = event.dataTransfer.files?.[0];
    void loadPdfFile(file);
  };

  const applyHtml = () => {
    setHtmlActive(htmlDraft);
    setMode("html");
  };

  const toggleOrientation = () => {
    setOrientation((current) => (current === "portrait" ? "landscape" : "portrait"));
  };

  const hasPreview =
    (mode === "pdf" && Boolean(pdfName) && !pdfError) ||
    (mode === "url" && Boolean(urlActive)) ||
    (mode === "html" && Boolean(htmlActive.trim()));

  const showUrlBlocked = mode === "url" && Boolean(urlActive) && urlFrameStatus === "blocked";
  const showUrlLoading = mode === "url" && Boolean(urlActive) && urlFrameStatus === "loading";
  const showUrlSoftWarning =
    mode === "url" && Boolean(urlActive) && urlSoftWarning && !showUrlBlocked;

  return (
    <div className={clsx("responsive-device-preview-tool tool-split-workspace", className)}>
      <p className="responsive-device-preview-tool__privacy">{labels.privacyLabel}</p>

      <div className="responsive-device-preview-tool__layout tool-split-workspace__layout">
        <aside className="responsive-device-preview-tool__sidebar tool-split-workspace__pane tool-split-workspace__pane--form">
          <section className="tool-workspace-panel responsive-device-preview-tool__panel">
            <h2 className="responsive-device-preview-tool__section-title">{labels.sourceTitle}</h2>

            <div className="responsive-device-preview-tool__mode-tabs" role="tablist" aria-label={labels.sourceTitle}>
              {(
                [
                  ["pdf", labels.modePdf],
                  ["url", labels.modeUrl],
                  ["html", labels.modeHtml],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  className={clsx(
                    "responsive-device-preview-tool__mode-tab",
                    mode === value && "is-active",
                  )}
                  onClick={() => setMode(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "pdf" ? (
              <div className="responsive-device-preview-tool__source-block">
                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={onFileChange}
                />
                <label
                  htmlFor={fileInputId}
                  className={clsx(
                    "responsive-device-preview-tool__dropzone",
                    pdfDragOver && "is-dragover",
                  )}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setPdfDragOver(true);
                  }}
                  onDragLeave={() => setPdfDragOver(false)}
                  onDrop={onDrop}
                >
                  <Upload className="responsive-device-preview-tool__drop-icon" aria-hidden />
                  <span className="responsive-device-preview-tool__drop-title">{labels.pdfDropTitle}</span>
                  <span className="responsive-device-preview-tool__drop-hint">{labels.pdfDropHint}</span>
                  <span className="responsive-device-preview-tool__browse">{labels.pdfBrowse}</span>
                </label>

                {pdfLoading ? (
                  <p className="responsive-device-preview-tool__status">{labels.pdfLoading}</p>
                ) : null}
                {pdfError ? (
                  <p className="responsive-device-preview-tool__error" role="alert">
                    {pdfError}
                  </p>
                ) : null}
                {pdfName ? (
                  <div className="responsive-device-preview-tool__pdf-meta">
                    <p className="responsive-device-preview-tool__file-name">{pdfName}</p>
                    {pdfPageCount > 0 ? (
                      <div className="responsive-device-preview-tool__page-row">
                        <label htmlFor={`${fileInputId}-page`}>
                          {labels.pdfPageLabel
                            .replace("{current}", String(pdfPage))
                            .replace("{total}", String(pdfPageCount))}
                        </label>
                        <input
                          id={`${fileInputId}-page`}
                          type="range"
                          min={1}
                          max={pdfPageCount}
                          value={pdfPage}
                          onChange={(event) => setPdfPage(Number(event.target.value))}
                        />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="responsive-device-preview-tool__ghost-btn"
                      onClick={() => void clearPdf()}
                    >
                      {labels.pdfClear}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {mode === "url" ? (
              <div className="responsive-device-preview-tool__source-block">
                <label className="responsive-device-preview-tool__label" htmlFor={urlInputId}>
                  {labels.urlLabel}
                </label>
                <div className="responsive-device-preview-tool__url-row">
                  <input
                    id={urlInputId}
                    type="url"
                    inputMode="url"
                    className="responsive-device-preview-tool__input"
                    placeholder={labels.urlPlaceholder}
                    value={urlDraft}
                    onChange={(event) => setUrlDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void applyUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="responsive-device-preview-tool__primary-btn"
                    onClick={() => void applyUrl()}
                  >
                    {labels.urlLoad}
                  </button>
                </div>
                <p className="responsive-device-preview-tool__hint">{labels.urlHint}</p>
                <p className="responsive-device-preview-tool__hint">{labels.urlBlockedHint}</p>
                {showUrlBlocked ? (
                  <div className="responsive-device-preview-tool__url-alert" role="alert">
                    <AlertTriangle aria-hidden size={16} />
                    <div>
                      <p className="responsive-device-preview-tool__url-alert-title">
                        {labels.urlBlockedTitle}
                      </p>
                      <p className="responsive-device-preview-tool__url-alert-body">
                        {labels.urlBlockedBody}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {mode === "html" ? (
              <div className="responsive-device-preview-tool__source-block">
                <label className="responsive-device-preview-tool__label" htmlFor={htmlInputId}>
                  {labels.htmlLabel}
                </label>
                <textarea
                  id={htmlInputId}
                  className="responsive-device-preview-tool__textarea"
                  rows={10}
                  spellCheck={false}
                  placeholder={labels.htmlPlaceholder}
                  value={htmlDraft}
                  onChange={(event) => setHtmlDraft(event.target.value)}
                />
                <div className="responsive-device-preview-tool__html-actions">
                  <button
                    type="button"
                    className="responsive-device-preview-tool__primary-btn"
                    onClick={applyHtml}
                  >
                    {labels.htmlApply}
                  </button>
                  <button
                    type="button"
                    className="responsive-device-preview-tool__ghost-btn"
                    onClick={() => {
                      setHtmlDraft(SAMPLE_HTML);
                      setHtmlActive(SAMPLE_HTML);
                      setMode("html");
                    }}
                  >
                    {labels.htmlResetSample}
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="tool-workspace-panel responsive-device-preview-tool__panel">
            <h2 className="responsive-device-preview-tool__section-title">{labels.deviceTitle}</h2>

            <div className="responsive-device-preview-tool__device-grid" role="group" aria-label={labels.deviceTitle}>
              {DEVICE_PRESET_ORDER.map((presetId) => {
                const Icon = DEVICE_ICONS[presetId];
                return (
                  <button
                    key={presetId}
                    type="button"
                    className={clsx(
                      "responsive-device-preview-tool__device-btn",
                      device === presetId && "is-active",
                    )}
                    aria-pressed={device === presetId}
                    onClick={() => setDevice(presetId)}
                  >
                    <Icon aria-hidden className="responsive-device-preview-tool__device-icon" />
                    <span>{deviceLabels[presetId]}</span>
                  </button>
                );
              })}
            </div>

            <div className="responsive-device-preview-tool__control-row">
              <span className="responsive-device-preview-tool__label">{labels.orientationLabel}</span>
              <div className="responsive-device-preview-tool__segment" role="group">
                <button
                  type="button"
                  className={clsx(
                    "responsive-device-preview-tool__segment-btn",
                    orientation === "portrait" && "is-active",
                  )}
                  aria-pressed={orientation === "portrait"}
                  onClick={() => setOrientation("portrait")}
                >
                  {labels.portraitLabel}
                </button>
                <button
                  type="button"
                  className={clsx(
                    "responsive-device-preview-tool__segment-btn",
                    orientation === "landscape" && "is-active",
                  )}
                  aria-pressed={orientation === "landscape"}
                  onClick={() => setOrientation("landscape")}
                >
                  {labels.landscapeLabel}
                </button>
              </div>
              <button
                type="button"
                className="responsive-device-preview-tool__icon-btn"
                onClick={toggleOrientation}
                aria-label={labels.rotateLabel}
                title={labels.rotateLabel}
              >
                <RotateCw aria-hidden size={18} />
              </button>
            </div>

            <div className="responsive-device-preview-tool__control-row">
              <span className="responsive-device-preview-tool__label">{labels.zoomLabel}</span>
              <div className="responsive-device-preview-tool__zoom">
                <button
                  type="button"
                  className="responsive-device-preview-tool__icon-btn"
                  aria-label={labels.zoomOutLabel}
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
                >
                  <ZoomOut aria-hidden size={18} />
                </button>
                <button
                  type="button"
                  className="responsive-device-preview-tool__zoom-value"
                  onClick={() => setZoom(1)}
                  title={labels.zoomResetLabel}
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  className="responsive-device-preview-tool__icon-btn"
                  aria-label={labels.zoomInLabel}
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
                >
                  <ZoomIn aria-hidden size={18} />
                </button>
              </div>
            </div>

            <p className="responsive-device-preview-tool__viewport-meta">
              {labels.viewportSizeLabel}: {formatViewportLabel(viewport.width, viewport.height)}
            </p>
          </section>

          <section
            className="tool-workspace-panel responsive-device-preview-tool__overview"
            aria-labelledby={overviewId}
          >
            <h2 id={overviewId} className="responsive-device-preview-tool__overview-title">
              {labels.overviewTitle}
            </h2>
            <p className="responsive-device-preview-tool__overview-intro">{labels.overviewIntro}</p>

            <div className="responsive-device-preview-tool__overview-grid">
              <article className="responsive-device-preview-tool__overview-card">
                <h3>{labels.overviewPdfTitle}</h3>
                <p>{labels.overviewPdfBody}</p>
              </article>
              <article className="responsive-device-preview-tool__overview-card">
                <h3>{labels.overviewUrlTitle}</h3>
                <p>{labels.overviewUrlBody}</p>
              </article>
              <article className="responsive-device-preview-tool__overview-card">
                <h3>{labels.overviewHtmlTitle}</h3>
                <p>{labels.overviewHtmlBody}</p>
              </article>
              <article className="responsive-device-preview-tool__overview-card">
                <h3>{labels.overviewDevicesTitle}</h3>
                <p>{labels.overviewDevicesBody}</p>
              </article>
              <article className="responsive-device-preview-tool__overview-card responsive-device-preview-tool__overview-card--wide">
                <h3>{labels.overviewControlsTitle}</h3>
                <p>{labels.overviewControlsBody}</p>
              </article>
            </div>
          </section>
        </aside>

        <section
          className="tool-workspace-panel responsive-device-preview-tool__stage-panel tool-split-workspace__pane tool-split-workspace__pane--preview"
          aria-label={labels.previewTitle}
        >
          <div className="responsive-device-preview-tool__stage-header">
            <h2 className="responsive-device-preview-tool__section-title">{labels.previewTitle}</h2>
            <span className="responsive-device-preview-tool__frame-chip">
              {deviceLabels[device]} · {formatViewportLabel(viewport.width, viewport.height)}
            </span>
          </div>

          <div className="responsive-device-preview-tool__stage">
            {!hasPreview ? (
              <p className="responsive-device-preview-tool__empty">{labels.previewEmpty}</p>
            ) : (
              <div
                className="responsive-device-preview-tool__scale-wrap"
                style={{ transform: `scale(${zoom})` }}
              >
                <div
                  className={clsx(
                    "responsive-device-preview-tool__device-frame",
                    `responsive-device-preview-tool__device-frame--${device}`,
                    orientation === "landscape" && "is-landscape",
                  )}
                >
                  {device === "phone" ? (
                    <div className="responsive-device-preview-tool__notch" aria-hidden />
                  ) : null}
                  {device === "desktop" ? (
                    <div className="responsive-device-preview-tool__browser-chrome" aria-hidden>
                      <span className="responsive-device-preview-tool__traffic">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className="responsive-device-preview-tool__address">
                        {mode === "url" && urlActive
                          ? urlActive
                          : mode === "pdf" && pdfName
                            ? pdfName
                            : labels.frameChromeLabel}
                      </span>
                    </div>
                  ) : null}

                  <div
                    className="responsive-device-preview-tool__viewport"
                    style={{
                      width: viewport.width,
                      height: viewport.height,
                    }}
                  >
                    {mode === "pdf" ? (
                      <div className="responsive-device-preview-tool__pdf-scroll">
                        <canvas ref={pdfCanvasRef} className="responsive-device-preview-tool__pdf-canvas" />
                      </div>
                    ) : null}

                    {mode === "url" && urlActive ? (
                      <>
                        <iframe
                          key={urlFrameKey}
                          ref={urlIframeRef}
                          title={labels.previewTitle}
                          className={clsx(
                            "responsive-device-preview-tool__iframe",
                            showUrlBlocked && "is-blocked",
                          )}
                          src={urlActive}
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                          referrerPolicy="no-referrer"
                          onLoad={onUrlIframeLoad}
                          onError={() => markUrlBlocked(urlLoadTokenRef.current)}
                        />
                        {showUrlLoading ? (
                          <div className="responsive-device-preview-tool__frame-status" aria-live="polite">
                            {labels.urlLoading}
                          </div>
                        ) : null}
                        {showUrlBlocked ? (
                          <div
                            className="responsive-device-preview-tool__frame-overlay"
                            role="alert"
                          >
                            <AlertTriangle aria-hidden className="responsive-device-preview-tool__frame-overlay-icon" />
                            <p className="responsive-device-preview-tool__frame-overlay-title">
                              {labels.urlBlockedTitle}
                            </p>
                            <p className="responsive-device-preview-tool__frame-overlay-body">
                              {labels.urlBlockedBody}
                            </p>
                            <p className="responsive-device-preview-tool__frame-overlay-policy">
                              {labels.urlBlockedPolicy}
                            </p>
                            <div className="responsive-device-preview-tool__frame-overlay-actions">
                              <button
                                type="button"
                                className="responsive-device-preview-tool__primary-btn"
                                onClick={() => setMode("html")}
                              >
                                {labels.urlTryHtml}
                              </button>
                              <button
                                type="button"
                                className="responsive-device-preview-tool__ghost-btn"
                                onClick={() => setMode("pdf")}
                              >
                                {labels.urlTryPdf}
                              </button>
                              <a
                                className="responsive-device-preview-tool__ghost-btn responsive-device-preview-tool__external-link"
                                href={urlActive}
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                {labels.urlOpenExternal}
                              </a>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {mode === "html" ? (
                      <iframe
                        title={labels.previewTitle}
                        className="responsive-device-preview-tool__iframe"
                        srcDoc={htmlActive}
                        sandbox="allow-scripts"
                      />
                    ) : null}
                  </div>

                  {device === "phone" ? (
                    <div className="responsive-device-preview-tool__home-bar" aria-hidden />
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {showUrlBlocked ? (
            <div className="responsive-device-preview-tool__below-frame-notice" role="status">
              <AlertTriangle aria-hidden size={16} />
              <p>
                {labels.urlBlockedBody} {labels.urlBlockedPolicy}
              </p>
            </div>
          ) : null}

          {showUrlSoftWarning ? (
            <div className="responsive-device-preview-tool__below-frame-notice responsive-device-preview-tool__below-frame-notice--soft" role="status">
              <AlertTriangle aria-hidden size={16} />
              <div className="responsive-device-preview-tool__below-frame-copy">
                <p>
                  {labels.urlBlockedBody} {labels.urlBlockedPolicy}
                </p>
                <div className="responsive-device-preview-tool__frame-overlay-actions">
                  <button
                    type="button"
                    className="responsive-device-preview-tool__primary-btn"
                    onClick={() => setMode("html")}
                  >
                    {labels.urlTryHtml}
                  </button>
                  <button
                    type="button"
                    className="responsive-device-preview-tool__ghost-btn"
                    onClick={() => setMode("pdf")}
                  >
                    {labels.urlTryPdf}
                  </button>
                  {urlActive ? (
                    <a
                      className="responsive-device-preview-tool__ghost-btn responsive-device-preview-tool__external-link"
                      href={urlActive}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {labels.urlOpenExternal}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
