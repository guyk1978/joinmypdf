"use client";

import { clsx } from "clsx";
import { Download, LayoutGrid, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import {
  FaviconPreviewerPresetLibrary,
  type FaviconPreviewerPresetLibraryLabels,
} from "@/components/FaviconPreviewerPresetLibrary";
import { SaveProjectButton } from "@/components/SaveProjectButton";
import { imBtnCta } from "@/lib/design-system";
import {
  buildFaviconPackZip,
  downloadBlob,
  faviconPackOutputName,
} from "@/lib/favicon-pack";
import {
  DEFAULT_FAVICON_PREVIEW_TITLE,
  isAcceptedFaviconPreviewFile,
  isLikelyFaviconPreviewUrl,
  normalizeFaviconPreviewUrl,
  resolveFaviconPreviewFromFile,
  type FaviconPreviewUiTheme,
} from "@/lib/favicon-previewer";
import { FAVICON_PREVIEW_PRESETS } from "@/lib/favicon-previewer-presets";
import { toolPrimaryBtn } from "@/lib/tool-ui";

export type FaviconPreviewerLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  orUseUrl: string;
  urlLabel: string;
  urlPlaceholder: string;
  applyUrl: string;
  titleLabel: string;
  titlePlaceholder: string;
  uiThemeLabel: string;
  themeLight: string;
  themeDark: string;
  previewInstructions: string;
  browserTabLabel: string;
  bookmarksLabel: string;
  homeScreenLabel: string;
  bookmarkOtherSite: string;
  invalidFile: string;
  invalidUrl: string;
  replaceFavicon: string;
  downloadPack: string;
  downloadingPack: string;
  downloadFailed: string;
  library: FaviconPreviewerPresetLibraryLabels;
};

export type FaviconPreviewerProps = {
  labels: FaviconPreviewerLabels;
  className?: string;
  toolSlug?: string;
  operation?: string;
  /** Fires when a favicon preview is loaded/cleared — drives clean vs active header chrome. */
  onPreviewActiveChange?: (active: boolean) => void;
};

const ACCEPT =
  "image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.png,.jpg,.jpeg,.svg,.ico";
const URL_DEBOUNCE_MS = 320;

type FaviconIconProps = {
  src: string;
  className?: string;
  size?: number;
};

function FaviconIcon({ src, className, size = 16 }: FaviconIconProps) {
  return (
    // Decorative preview glyph — empty alt is intentional.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      width={size}
      height={size}
      draggable={false}
    />
  );
}

type PreviewMockupsProps = {
  iconUrl: string;
  title: string;
  theme: FaviconPreviewUiTheme;
  labels: FaviconPreviewerLabels;
};

function PreviewMockups({ iconUrl, title, theme, labels }: PreviewMockupsProps) {
  const displayTitle = title.trim() || DEFAULT_FAVICON_PREVIEW_TITLE;

  return (
    <div
      className={clsx(
        "favicon-previewer-tool__mockups",
        theme === "light"
          ? "favicon-previewer-tool__mockups--light"
          : "favicon-previewer-tool__mockups--dark",
      )}
    >
      <section className="favicon-previewer-tool__mockup tool-workspace-panel">
        <h3 className="favicon-previewer-tool__mockup-label">{labels.browserTabLabel}</h3>
        <div className="favicon-previewer-tool__browser-chrome">
          <div className="favicon-previewer-tool__browser-tab favicon-previewer-tool__browser-tab--active">
            <FaviconIcon src={iconUrl} className="favicon-previewer-tool__tab-icon" size={16} />
            <span className="favicon-previewer-tool__tab-title">{displayTitle}</span>
            <span className="favicon-previewer-tool__tab-close" aria-hidden />
          </div>
          <div className="favicon-previewer-tool__browser-tab favicon-previewer-tool__browser-tab--inactive">
            <span className="favicon-previewer-tool__tab-title favicon-previewer-tool__tab-title--muted">
              New Tab
            </span>
          </div>
        </div>
      </section>

      <section className="favicon-previewer-tool__mockup tool-workspace-panel">
        <h3 className="favicon-previewer-tool__mockup-label">{labels.bookmarksLabel}</h3>
        <div className="favicon-previewer-tool__bookmarks-bar">
          <div className="favicon-previewer-tool__bookmark favicon-previewer-tool__bookmark--active">
            <FaviconIcon src={iconUrl} className="favicon-previewer-tool__bookmark-icon" size={16} />
            <span>{displayTitle}</span>
          </div>
          <div className="favicon-previewer-tool__bookmark">
            <span className="favicon-previewer-tool__bookmark-placeholder" aria-hidden />
            <span>{labels.bookmarkOtherSite}</span>
          </div>
        </div>
      </section>

      <section className="favicon-previewer-tool__mockup tool-workspace-panel">
        <h3 className="favicon-previewer-tool__mockup-label">{labels.homeScreenLabel}</h3>
        <div className="favicon-previewer-tool__home-screen">
          <div className="favicon-previewer-tool__home-icon-wrap">
            <FaviconIcon
              src={iconUrl}
              className="favicon-previewer-tool__home-icon"
              size={56}
            />
          </div>
          <span className="favicon-previewer-tool__home-label">{displayTitle}</span>
        </div>
      </section>
    </div>
  );
}

async function fileFromPreviewUrl(url: string, fallbackName: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to read favicon bytes.");
  const blob = await response.blob();
  const type = blob.type || "image/png";
  const ext =
    type.includes("svg")
      ? "svg"
      : type.includes("jpeg") || type.includes("jpg")
        ? "jpg"
        : type.includes("icon")
          ? "ico"
          : "png";
  const base = fallbackName.replace(/\.[^.]+$/, "") || "favicon";
  return new File([blob], `${base}.${ext}`, { type });
}

export function FaviconPreviewer({
  labels,
  className,
  toolSlug = "favicon-previewer",
  operation = "favicon-previewer",
  onPreviewActiveChange,
}: FaviconPreviewerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const urlTimerRef = useRef<number | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [pageTitle, setPageTitle] = useState(DEFAULT_FAVICON_PREVIEW_TITLE);
  const [uiTheme, setUiTheme] = useState<FaviconPreviewUiTheme>("dark");
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [packBusy, setPackBusy] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onPreviewActiveChange?.(Boolean(iconUrl));
  }, [iconUrl, onPreviewActiveChange]);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl();
      if (urlTimerRef.current !== null) {
        window.clearTimeout(urlTimerRef.current);
      }
    };
  }, [revokeObjectUrl]);

  useEffect(() => {
    let cancelled = false;

    const syncProjectFiles = async () => {
      if (sourceFile) {
        if (!cancelled) setProjectFiles([sourceFile]);
        return;
      }
      if (!iconUrl) {
        if (!cancelled) setProjectFiles([]);
        return;
      }
      try {
        const file = await fileFromPreviewUrl(iconUrl, "favicon");
        if (!cancelled) setProjectFiles([file]);
      } catch {
        if (!cancelled) setProjectFiles([]);
      }
    };

    void syncProjectFiles();
    return () => {
      cancelled = true;
    };
  }, [sourceFile, iconUrl]);

  const reset = useCallback(() => {
    revokeObjectUrl();
    setSourceFile(null);
    setIconUrl(null);
    setUrlInput("");
    setPageTitle(DEFAULT_FAVICON_PREVIEW_TITLE);
    setProjectFiles([]);
    setPackBusy(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl]);

  const setPreviewUrl = useCallback(
    (url: string, file: File | null) => {
      revokeObjectUrl();
      if (file) {
        objectUrlRef.current = url;
      }
      setSourceFile(file);
      setIconUrl(url);
      setError("");
    },
    [revokeObjectUrl],
  );

  const loadFile = useCallback(
    async (file: File, suggestedTitle?: string) => {
      if (!isAcceptedFaviconPreviewFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      try {
        const url = await resolveFaviconPreviewFromFile(file);
        setUrlInput("");
        setPreviewUrl(url, file);
        if (suggestedTitle?.trim()) {
          setPageTitle(suggestedTitle.trim());
        }
      } catch {
        setError(labels.invalidFile);
      }
    },
    [labels.invalidFile, setPreviewUrl],
  );

  const loadPreset = useCallback(
    (file: File, suggestedTitle: string) => {
      void loadFile(file, suggestedTitle);
    },
    [loadFile],
  );

  const loadUrl = useCallback(
    (value: string) => {
      const normalized = normalizeFaviconPreviewUrl(value);
      if (!isLikelyFaviconPreviewUrl(normalized)) {
        setError(labels.invalidUrl);
        return;
      }

      setPreviewUrl(normalized, null);
    },
    [labels.invalidUrl, setPreviewUrl],
  );

  useEffect(() => {
    if (!urlInput.trim() || sourceFile) return;

    if (urlTimerRef.current !== null) {
      window.clearTimeout(urlTimerRef.current);
    }

    urlTimerRef.current = window.setTimeout(() => {
      if (isLikelyFaviconPreviewUrl(urlInput)) {
        loadUrl(urlInput);
      }
    }, URL_DEBOUNCE_MS);

    return () => {
      if (urlTimerRef.current !== null) {
        window.clearTimeout(urlTimerRef.current);
      }
    };
  }, [urlInput, sourceFile, loadUrl]);

  const downloadPack = useCallback(async () => {
    if (!iconUrl || packBusy) return;
    setPackBusy(true);
    setError("");
    try {
      const blob = await buildFaviconPackZip(iconUrl, {
        siteTitle: pageTitle.trim() || DEFAULT_FAVICON_PREVIEW_TITLE,
      });
      const name = faviconPackOutputName(sourceFile?.name || projectFiles[0]?.name || "favicon");
      downloadBlob(blob, name);
    } catch {
      setError(labels.downloadFailed);
    } finally {
      setPackBusy(false);
    }
  }, [iconUrl, labels.downloadFailed, packBusy, pageTitle, projectFiles, sourceFile?.name]);

  return (
    <div className={clsx("favicon-previewer-tool", className)}>
      {!iconUrl ? (
        <div className="favicon-previewer-tool__source">
          <div className="favicon-previewer-tool__url-field tool-workspace-panel">
            <label htmlFor="favicon-preview-url" className="favicon-previewer-tool__label">
              {labels.urlLabel}
            </label>
            <div className="favicon-previewer-tool__url-row">
              <input
                id="favicon-preview-url"
                type="url"
                className="favicon-previewer-tool__url-input"
                value={urlInput}
                onChange={(event) => {
                  setError("");
                  setUrlInput(event.target.value);
                }}
                placeholder={labels.urlPlaceholder}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                className={clsx(imBtnCta, "favicon-previewer-tool__url-btn")}
                onClick={() => loadUrl(urlInput)}
              >
                {labels.applyUrl}
              </button>
            </div>
          </div>

          <p className="favicon-previewer-tool__or">{labels.orUseUrl}</p>

          <ImageToolDropzone
            dropTitle={labels.dropTitle}
            selectLabel={labels.selectFile}
            selectAria={labels.selectFileAria}
            dropHint={labels.dropHint}
            supportedFormats={["ICO", "PNG", "JPG", "SVG"]}
            accept={ACCEPT}
            compact
            showPrivacy={false}
            onFiles={(files) => {
              const file = Array.from(files)[0];
              if (file) void loadFile(file);
            }}
          />

          <div className="favicon-preset-library__trigger-wrap">
            <button
              type="button"
              className="favicon-preset-library__trigger"
              onClick={() => setLibraryOpen(true)}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
              <span>{labels.library.openLibrary}</span>
              <span className="favicon-preset-library__trigger-count">
                {FAVICON_PREVIEW_PRESETS.length}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="favicon-previewer-tool__workspace">
          <p className="favicon-previewer-tool__instructions">{labels.previewInstructions}</p>

          <div className="favicon-previewer-tool__controls tool-workspace-panel">
            <div className="favicon-previewer-tool__control">
              <label htmlFor="favicon-preview-title" className="favicon-previewer-tool__label">
                {labels.titleLabel}
              </label>
              <input
                id="favicon-preview-title"
                type="text"
                className="favicon-previewer-tool__title-input"
                value={pageTitle}
                onChange={(event) => setPageTitle(event.target.value)}
                placeholder={labels.titlePlaceholder}
                spellCheck={false}
              />
            </div>

            <div className="favicon-previewer-tool__control">
              <span className="favicon-previewer-tool__label" id="favicon-preview-theme-label">
                {labels.uiThemeLabel}
              </span>
              <div
                className="favicon-previewer-tool__theme-row"
                role="radiogroup"
                aria-labelledby="favicon-preview-theme-label"
              >
                <label className="favicon-previewer-tool__theme-option">
                  <input
                    type="radio"
                    name="favicon-preview-theme"
                    checked={uiTheme === "light"}
                    onChange={() => setUiTheme("light")}
                  />
                  <span>{labels.themeLight}</span>
                </label>
                <label className="favicon-previewer-tool__theme-option">
                  <input
                    type="radio"
                    name="favicon-preview-theme"
                    checked={uiTheme === "dark"}
                    onChange={() => setUiTheme("dark")}
                  />
                  <span>{labels.themeDark}</span>
                </label>
              </div>
            </div>

            <div className="favicon-previewer-tool__control-actions">
              <button
                type="button"
                className="crop-image-tool__secondary-btn favicon-previewer-tool__replace-btn"
                onClick={reset}
              >
                {labels.replaceFavicon}
              </button>
              <button
                type="button"
                className="crop-image-tool__secondary-btn favicon-previewer-tool__library-btn"
                onClick={() => setLibraryOpen(true)}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                {labels.library.openLibrary}
              </button>
            </div>
          </div>

          <div className="favicon-previewer-tool__actions">
            <button
              type="button"
              className={clsx(toolPrimaryBtn, "favicon-previewer-tool__action-btn")}
              disabled={packBusy}
              onClick={() => void downloadPack()}
            >
              {packBusy ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {packBusy ? labels.downloadingPack : labels.downloadPack}
            </button>
            <SaveProjectButton
              toolSlug={toolSlug}
              operation={operation}
              files={projectFiles}
              settings={{
                pageTitle,
                uiTheme,
                sourceUrl: sourceFile ? null : urlInput || iconUrl,
              }}
              disabled={projectFiles.length === 0 || packBusy}
              className="favicon-previewer-tool__action-btn"
            />
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={iconUrl}
            alt=""
            className="sr-only"
            onError={() => setError(labels.invalidUrl)}
            onLoad={() => setError("")}
          />

          <PreviewMockups iconUrl={iconUrl} title={pageTitle} theme={uiTheme} labels={labels} />
        </div>
      )}

      <FaviconPreviewerPresetLibrary
        labels={labels.library}
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelectPreset={loadPreset}
        showTrigger={false}
      />

      {error ? (
        <p className="crop-image-tool__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
