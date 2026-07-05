"use client";

import { useEffect, useRef } from "react";
import { createImage } from "@/lib/crop-image";
import { drawSvgToSquareCanvas } from "@/lib/svg-to-favicon";

export type SvgToFaviconMobilePreviewLabels = {
  mobilePreviewTitle: string;
  mobilePreviewHint: string;
  desktopTabLabel: string;
  iosTabSwitcherLabel: string;
  androidTabSwitcherLabel: string;
  defaultSiteTitle: string;
  inactiveTabLabel: string;
};

type SvgToFaviconMobilePreviewProps = {
  imageSrc: string;
  siteTitle: string;
  labels: SvgToFaviconMobilePreviewLabels;
};

type SvgFaviconCanvasIconProps = {
  imageSrc: string;
  size: number;
  className?: string;
};

function SvgFaviconCanvasIcon({ imageSrc, size, className }: SvgFaviconCanvasIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    void createImage(imageSrc).then((image) => {
      if (cancelled || !canvasRef.current) return;
      const square = drawSvgToSquareCanvas(image, size);
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

export function SvgToFaviconMobilePreview({
  imageSrc,
  siteTitle,
  labels,
}: SvgToFaviconMobilePreviewProps) {
  const displayTitle = siteTitle.trim() || labels.defaultSiteTitle;

  return (
    <section
      className="generate-favicon-tool__mobile-preview tool-workspace-panel"
      aria-labelledby="svg-to-favicon-mobile-preview-title"
    >
      <h2
        id="svg-to-favicon-mobile-preview-title"
        className="generate-favicon-tool__mobile-preview-heading"
      >
        {labels.mobilePreviewTitle}
      </h2>
      <p className="svg-to-favicon-tool__mobile-preview-hint">{labels.mobilePreviewHint}</p>

      <div className="generate-favicon-tool__mobile-preview-grid">
        <article className="generate-favicon-tool__device-mockup">
          <h3 className="generate-favicon-tool__device-label">{labels.desktopTabLabel}</h3>
          <div className="generate-favicon-tool__desktop-chrome">
            <div className="generate-favicon-tool__desktop-tab generate-favicon-tool__desktop-tab--active">
              <SvgFaviconCanvasIcon
                imageSrc={imageSrc}
                size={16}
                className="generate-favicon-tool__device-favicon"
              />
              <span className="generate-favicon-tool__device-tab-title">{displayTitle}</span>
              <span className="generate-favicon-tool__device-tab-close" aria-hidden />
            </div>
            <div className="generate-favicon-tool__desktop-tab generate-favicon-tool__desktop-tab--inactive">
              <span className="generate-favicon-tool__device-tab-title generate-favicon-tool__device-tab-title--muted">
                {labels.inactiveTabLabel}
              </span>
            </div>
          </div>
        </article>

        <article className="generate-favicon-tool__device-mockup generate-favicon-tool__device-mockup--ios">
          <h3 className="generate-favicon-tool__device-label">{labels.iosTabSwitcherLabel}</h3>
          <div className="generate-favicon-tool__ios-switcher">
            <div className="generate-favicon-tool__ios-card generate-favicon-tool__ios-card--active">
              <SvgFaviconCanvasIcon
                imageSrc={imageSrc}
                size={32}
                className="generate-favicon-tool__device-favicon generate-favicon-tool__device-favicon--ios"
              />
              <span className="generate-favicon-tool__ios-card-title">{displayTitle}</span>
            </div>
            <div className="generate-favicon-tool__ios-card">
              <span className="generate-favicon-tool__ios-card-placeholder" aria-hidden />
              <span className="generate-favicon-tool__ios-card-title generate-favicon-tool__device-tab-title--muted">
                {labels.inactiveTabLabel}
              </span>
            </div>
          </div>
        </article>

        <article className="generate-favicon-tool__device-mockup generate-favicon-tool__device-mockup--android">
          <h3 className="generate-favicon-tool__device-label">{labels.androidTabSwitcherLabel}</h3>
          <div className="generate-favicon-tool__android-switcher">
            <div className="generate-favicon-tool__android-card generate-favicon-tool__android-card--active">
              <SvgFaviconCanvasIcon
                imageSrc={imageSrc}
                size={28}
                className="generate-favicon-tool__device-favicon generate-favicon-tool__device-favicon--android"
              />
              <div className="generate-favicon-tool__android-card-body">
                <span className="generate-favicon-tool__android-card-title">{displayTitle}</span>
                <span className="generate-favicon-tool__android-card-url">yoursite.com</span>
              </div>
            </div>
            <div className="generate-favicon-tool__android-card">
              <span className="generate-favicon-tool__android-card-placeholder" aria-hidden />
              <div className="generate-favicon-tool__android-card-body">
                <span className="generate-favicon-tool__android-card-title generate-favicon-tool__device-tab-title--muted">
                  {labels.inactiveTabLabel}
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
