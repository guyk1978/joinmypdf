"use client";

export type TransparentFaviconBrowserMockupLabels = {
  title: string;
  hint: string;
  lightMode: string;
  darkMode: string;
};

type TransparentFaviconBrowserMockupProps = {
  previewDataUrl: string | null;
  labels: TransparentFaviconBrowserMockupLabels;
};

const MOCKUP_ICON_SIZE = 32;

export function TransparentFaviconBrowserMockup({
  previewDataUrl,
  labels,
}: TransparentFaviconBrowserMockupProps) {
  if (!previewDataUrl) return null;

  return (
    <div className="transparent-favicon-tool__mockup tool-workspace-panel">
      <p className="transparent-favicon-tool__mockup-title">{labels.title}</p>
      <p className="transparent-favicon-tool__mockup-hint">{labels.hint}</p>

      <div className="transparent-favicon-tool__mockup-grid">
        <div className="transparent-favicon-tool__mockup-cell">
          <span className="transparent-favicon-tool__mockup-theme">{labels.lightMode}</span>
          <div
            className="transparent-favicon-tool__mockup-frame transparent-favicon-tool__mockup-frame--light"
            aria-hidden
          >
            <img
              src={previewDataUrl}
              alt=""
              className="transparent-favicon-tool__mockup-img"
              width={MOCKUP_ICON_SIZE}
              height={MOCKUP_ICON_SIZE}
              draggable={false}
            />
          </div>
        </div>

        <div className="transparent-favicon-tool__mockup-cell">
          <span className="transparent-favicon-tool__mockup-theme">{labels.darkMode}</span>
          <div
            className="transparent-favicon-tool__mockup-frame transparent-favicon-tool__mockup-frame--dark"
            aria-hidden
          >
            <img
              src={previewDataUrl}
              alt=""
              className="transparent-favicon-tool__mockup-img"
              width={MOCKUP_ICON_SIZE}
              height={MOCKUP_ICON_SIZE}
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
