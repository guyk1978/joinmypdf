"use client";

import { useId, useState } from "react";
import { AppleTouchIconSafeZoneOverlay } from "@/components/AppleTouchIconSafeZoneOverlay";

export type AppleTouchIconHomeScreenPreviewLabels = {
  title: string;
  hint: string;
  defaultSiteTitle: string;
  safeZoneToggleLabel: string;
  safeZoneToggleAria: string;
  safeZoneFlatPreviewLabel: string;
};

type AppleTouchIconHomeScreenPreviewProps = {
  imageSrc: string;
  previewUrl: string | null;
  siteTitle: string;
  labels: AppleTouchIconHomeScreenPreviewLabels;
};

export function AppleTouchIconHomeScreenPreview({
  imageSrc,
  previewUrl,
  siteTitle,
  labels,
}: AppleTouchIconHomeScreenPreviewProps) {
  const maskId = useId().replace(/:/g, "");
  const [showSafeZone, setShowSafeZone] = useState(true);
  const displayTitle = siteTitle.trim() || labels.defaultSiteTitle;
  const iconSrc = previewUrl ?? imageSrc;

  return (
    <section
      className="apple-touch-icon-tool__home-screen tool-workspace-panel"
      aria-labelledby="apple-touch-home-screen-heading"
    >
      <h2 id="apple-touch-home-screen-heading" className="apple-touch-icon-tool__home-screen-title">
        {labels.title}
      </h2>
      <p className="apple-touch-icon-tool__home-screen-hint">{labels.hint}</p>

      <label className="apple-touch-icon-tool__safe-zone-toggle">
        <input
          type="checkbox"
          checked={showSafeZone}
          onChange={(event) => setShowSafeZone(event.target.checked)}
          aria-label={labels.safeZoneToggleAria}
        />
        <span>{labels.safeZoneToggleLabel}</span>
      </label>

      <div className="apple-touch-icon-tool__flat-preview">
        <span className="apple-touch-icon-tool__flat-preview-label">{labels.safeZoneFlatPreviewLabel}</span>
        <div className="apple-touch-icon-tool__flat-preview-frame">
          <img
            src={iconSrc}
            alt=""
            className="apple-touch-icon-tool__flat-preview-image"
            draggable={false}
          />
          {showSafeZone ? <AppleTouchIconSafeZoneOverlay maskId={`flat-${maskId}`} /> : null}
        </div>
      </div>

      <div className="apple-touch-icon-tool__iphone" role="img" aria-label={labels.title}>
        <div className="apple-touch-icon-tool__iphone-notch" aria-hidden />
        <div className="apple-touch-icon-tool__iphone-screen">
          <div className="apple-touch-icon-tool__iphone-wallpaper" aria-hidden />
          <div className="apple-touch-icon-tool__iphone-grid">
            <article className="apple-touch-icon-tool__iphone-tile apple-touch-icon-tool__iphone-tile--active">
              <div className="apple-touch-icon-tool__iphone-icon-wrap">
                <img
                  src={iconSrc}
                  alt=""
                  className="apple-touch-icon-tool__iphone-icon"
                  draggable={false}
                />
                {showSafeZone ? <AppleTouchIconSafeZoneOverlay maskId={`phone-${maskId}`} /> : null}
              </div>
              <span className="apple-touch-icon-tool__iphone-label">{displayTitle}</span>
            </article>

            <div className="apple-touch-icon-tool__iphone-tile apple-touch-icon-tool__iphone-tile--ghost" aria-hidden>
              <div className="apple-touch-icon-tool__iphone-icon-wrap apple-touch-icon-tool__iphone-icon-wrap--ghost" />
              <span className="apple-touch-icon-tool__iphone-label apple-touch-icon-tool__iphone-label--ghost" />
            </div>
            <div className="apple-touch-icon-tool__iphone-tile apple-touch-icon-tool__iphone-tile--ghost" aria-hidden>
              <div className="apple-touch-icon-tool__iphone-icon-wrap apple-touch-icon-tool__iphone-icon-wrap--ghost" />
              <span className="apple-touch-icon-tool__iphone-label apple-touch-icon-tool__iphone-label--ghost" />
            </div>
            <div className="apple-touch-icon-tool__iphone-tile apple-touch-icon-tool__iphone-tile--ghost" aria-hidden>
              <div className="apple-touch-icon-tool__iphone-icon-wrap apple-touch-icon-tool__iphone-icon-wrap--ghost" />
              <span className="apple-touch-icon-tool__iphone-label apple-touch-icon-tool__iphone-label--ghost" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
