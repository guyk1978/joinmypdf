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
import { imBtnCta } from "@/lib/design-system";
import {
  DEFAULT_FAVICON_PREVIEW_TITLE,
  isAcceptedFaviconPreviewFile,
  isLikelyFaviconPreviewUrl,
  normalizeFaviconPreviewUrl,
  resolveFaviconPreviewFromFile,
  type FaviconPreviewUiTheme,
} from "@/lib/favicon-previewer";

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
};

export type FaviconPreviewerProps = {
  labels: FaviconPreviewerLabels;
  className?: string;
};

const ACCEPT = "image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.png,.jpg,.jpeg,.svg,.ico";
const URL_DEBOUNCE_MS = 320;

type FaviconIconProps = {
  src: string;
  className?: string;
  size?: number;
};

function FaviconIcon({ src, className, size = 16 }: FaviconIconProps) {
  return (
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

export function FaviconPreviewer({ labels, className }: FaviconPreviewerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const urlTimerRef = useRef<number | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [pageTitle, setPageTitle] = useState(DEFAULT_FAVICON_PREVIEW_TITLE);
  const [uiTheme, setUiTheme] = useState<FaviconPreviewUiTheme>("dark");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

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

  const reset = useCallback(() => {
    revokeObjectUrl();
    setSourceFile(null);
    setIconUrl(null);
    setUrlInput("");
    setPageTitle(DEFAULT_FAVICON_PREVIEW_TITLE);
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
    async (file: File) => {
      if (!isAcceptedFaviconPreviewFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      try {
        const url = await resolveFaviconPreviewFromFile(file);
        setUrlInput("");
        setPreviewUrl(url, file);
      } catch {
        setError(labels.invalidFile);
      }
    },
    [labels.invalidFile, setPreviewUrl],
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

  return (
    <div className={clsx("favicon-previewer-tool", className)}>
      {!iconUrl ? (
        <div className="favicon-previewer-tool__source">
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
            >
              {labels.selectFile}
            </button>
          </div>

          <p className="favicon-previewer-tool__or">{labels.orUseUrl}</p>

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

            <button
              type="button"
              className="crop-image-tool__secondary-btn favicon-previewer-tool__replace-btn"
              onClick={reset}
            >
              {labels.replaceFavicon}
            </button>
          </div>

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

      {error ? (
        <p className="crop-image-tool__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
