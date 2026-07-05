"use client";

import { useEffect, useRef } from "react";
import { createImage } from "@/lib/crop-image";
import { drawFaviconPackIconCanvas } from "@/lib/favicon-pack";

export type FaviconPackFormatPreviewLabels = {
  title: string;
  hint: string;
  browserTabLabel: string;
  iosHomeScreenLabel: string;
  androidAppIconLabel: string;
  windowsTaskbarLabel: string;
  defaultSiteTitle: string;
};

type FaviconPackFormatPreviewProps = {
  imageSrc: string;
  siteTitle: string;
  labels: FaviconPackFormatPreviewLabels;
};

type PackCanvasIconProps = {
  imageSrc: string;
  size: number;
  className?: string;
};

function PackCanvasIcon({ imageSrc, size, className }: PackCanvasIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    void createImage(imageSrc).then((image) => {
      if (cancelled || !canvasRef.current) return;
      const square = drawFaviconPackIconCanvas(image, size);
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      canvasRef.current.width = size;
      canvasRef.current.height = size;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(square, 0, 0);
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      aria-hidden
    />
  );
}

export function FaviconPackFormatPreview({
  imageSrc,
  siteTitle,
  labels,
}: FaviconPackFormatPreviewProps) {
  const displayTitle = siteTitle.trim() || labels.defaultSiteTitle;

  return (
    <section
      className="favicon-pack-tool__format-preview tool-workspace-panel"
      aria-labelledby="favicon-pack-format-preview-heading"
    >
      <h2 id="favicon-pack-format-preview-heading" className="favicon-pack-tool__format-preview-title">
        {labels.title}
      </h2>
      <p className="favicon-pack-tool__format-preview-hint">{labels.hint}</p>

      <div className="favicon-pack-tool__format-preview-grid">
        <article className="favicon-pack-tool__format-mockup">
          <h3 className="favicon-pack-tool__format-label">{labels.browserTabLabel}</h3>
          <div className="generate-favicon-tool__desktop-chrome">
            <div className="generate-favicon-tool__desktop-tab generate-favicon-tool__desktop-tab--active">
              <PackCanvasIcon
                imageSrc={imageSrc}
                size={16}
                className="generate-favicon-tool__device-favicon"
              />
              <span className="generate-favicon-tool__device-tab-title">{displayTitle}</span>
              <span className="generate-favicon-tool__device-tab-close" aria-hidden />
            </div>
          </div>
        </article>

        <article className="favicon-pack-tool__format-mockup favicon-pack-tool__format-mockup--ios">
          <h3 className="favicon-pack-tool__format-label">{labels.iosHomeScreenLabel}</h3>
          <div className="favicon-pack-tool__ios-home">
            <div className="favicon-pack-tool__ios-home-icon-wrap">
              <PackCanvasIcon
                imageSrc={imageSrc}
                size={180}
                className="favicon-pack-tool__ios-home-icon"
              />
            </div>
            <span className="favicon-pack-tool__ios-home-label">{displayTitle}</span>
          </div>
        </article>

        <article className="favicon-pack-tool__format-mockup favicon-pack-tool__format-mockup--android">
          <h3 className="favicon-pack-tool__format-label">{labels.androidAppIconLabel}</h3>
          <div className="favicon-pack-tool__android-launcher">
            <div className="favicon-pack-tool__android-icon-wrap">
              <PackCanvasIcon
                imageSrc={imageSrc}
                size={192}
                className="favicon-pack-tool__android-icon"
              />
            </div>
            <span className="favicon-pack-tool__android-label">{displayTitle}</span>
          </div>
        </article>

        <article className="favicon-pack-tool__format-mockup favicon-pack-tool__format-mockup--windows">
          <h3 className="favicon-pack-tool__format-label">{labels.windowsTaskbarLabel}</h3>
          <div className="favicon-pack-tool__windows-taskbar">
            <div className="favicon-pack-tool__windows-pin">
              <PackCanvasIcon
                imageSrc={imageSrc}
                size={32}
                className="favicon-pack-tool__windows-pin-icon"
              />
              <span className="favicon-pack-tool__windows-pin-label">{displayTitle}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
