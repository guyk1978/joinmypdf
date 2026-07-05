"use client";

import { useEffect, useRef } from "react";
import { drawFaviconOnCanvas, normalizeFaviconText, type FaviconDesign } from "@/lib/generate-favicon";

export type GenerateFaviconMobilePreviewLabels = {
  mobilePreviewTitle: string;
  desktopTabLabel: string;
  iosTabSwitcherLabel: string;
  androidTabSwitcherLabel: string;
  defaultSiteTitle: string;
  inactiveTabLabel: string;
};

type GenerateFaviconMobilePreviewProps = {
  design: FaviconDesign;
  labels: GenerateFaviconMobilePreviewLabels;
};

type FaviconCanvasIconProps = {
  design: FaviconDesign;
  size: number;
  className?: string;
};

function FaviconCanvasIcon({ design, size, className }: FaviconCanvasIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) drawFaviconOnCanvas(ctx, size, design);
  }, [design, size]);

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

export function GenerateFaviconMobilePreview({
  design,
  labels,
}: GenerateFaviconMobilePreviewProps) {
  const siteTitle = normalizeFaviconText(design.text) || labels.defaultSiteTitle;

  return (
    <section
      className="generate-favicon-tool__mobile-preview tool-workspace-panel"
      aria-labelledby="favicon-mobile-preview-title"
    >
      <h2
        id="favicon-mobile-preview-title"
        className="generate-favicon-tool__mobile-preview-heading"
      >
        {labels.mobilePreviewTitle}
      </h2>

      <div className="generate-favicon-tool__mobile-preview-grid">
        <article className="generate-favicon-tool__device-mockup">
          <h3 className="generate-favicon-tool__device-label">{labels.desktopTabLabel}</h3>
          <div className="generate-favicon-tool__desktop-chrome">
            <div className="generate-favicon-tool__desktop-tab generate-favicon-tool__desktop-tab--active">
              <FaviconCanvasIcon
                design={design}
                size={16}
                className="generate-favicon-tool__device-favicon"
              />
              <span className="generate-favicon-tool__device-tab-title">{siteTitle}</span>
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
              <FaviconCanvasIcon
                design={design}
                size={32}
                className="generate-favicon-tool__device-favicon generate-favicon-tool__device-favicon--ios"
              />
              <span className="generate-favicon-tool__ios-card-title">{siteTitle}</span>
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
              <FaviconCanvasIcon
                design={design}
                size={28}
                className="generate-favicon-tool__device-favicon generate-favicon-tool__device-favicon--android"
              />
              <div className="generate-favicon-tool__android-card-body">
                <span className="generate-favicon-tool__android-card-title">{siteTitle}</span>
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
