"use client";

import {
  APPLE_TOUCH_ICON_INSET_RATIO,
  IOS_HOME_SCREEN_ICON_MASK_RADIUS_RATIO,
} from "@/lib/apple-touch-icon";

type AppleTouchIconSafeZoneOverlayProps = {
  /** Unique id prefix for SVG mask (avoid collisions when multiple previews mount). */
  maskId: string;
};

/**
 * Visual guide for iOS home screen icon masking: rounded-square clip edge + inner safe zone.
 */
export function AppleTouchIconSafeZoneOverlay({ maskId }: AppleTouchIconSafeZoneOverlayProps) {
  const insetPct = APPLE_TOUCH_ICON_INSET_RATIO * 100;
  const maskRadiusPct = IOS_HOME_SCREEN_ICON_MASK_RADIUS_RATIO * 100;
  const innerSpan = 100 - insetPct * 2;
  const innerRadiusPct =
    innerSpan > 0
      ? Math.max(0, ((maskRadiusPct / 100) * 100 - insetPct) / innerSpan) * 100
      : 0;
  const clipMaskId = `${maskId}-clip`;

  return (
    <div className="apple-touch-icon-tool__safe-zone" aria-hidden>
      <svg
        className="apple-touch-icon-tool__safe-zone-clip"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <mask id={clipMaskId}>
            <rect width="100" height="100" fill="white" />
            <rect
              width="100"
              height="100"
              rx={maskRadiusPct}
              ry={maskRadiusPct}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100"
          height="100"
          fill="rgba(0, 0, 0, 0.28)"
          mask={`url(#${clipMaskId})`}
        />
      </svg>

      <div
        className="apple-touch-icon-tool__safe-zone-mask-edge"
        style={{ borderRadius: `${maskRadiusPct}%` }}
      />

      <div
        className="apple-touch-icon-tool__safe-zone-inner"
        style={{
          inset: `${insetPct}%`,
          borderRadius: `${innerRadiusPct}%`,
        }}
      />
    </div>
  );
}
