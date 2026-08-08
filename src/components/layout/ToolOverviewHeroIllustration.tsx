import { getToolsInventoryEntry } from "@/data/tools-inventory";

type ToolOverviewHeroIllustrationProps = {
  slug: string;
  className?: string;
};

type IllustrationKind = "video-mute" | "video" | "pdf" | "image" | "generic";

function resolveIllustrationKind(slug: string): IllustrationKind {
  if (slug === "video-muter") return "video-mute";

  const entry = getToolsInventoryEntry(slug);
  const primary = entry?.primaryCategory;
  const cats = (entry?.categories ?? []) as readonly string[];

  if (primary === "video" || cats.includes("video") || cats.includes("mp4")) {
    return "video";
  }
  if (primary === "pdf" || cats.includes("pdf")) return "pdf";
  if (primary === "image" || cats.includes("image")) return "image";
  return "generic";
}

/** Static flat-vector art for the Overview hero — tool-aware, no animation. */
export function ToolOverviewHeroIllustration({
  slug,
  className,
}: ToolOverviewHeroIllustrationProps) {
  const kind = resolveIllustrationKind(slug);

  return (
    <div className={className} aria-hidden="true">
      {kind === "video-mute" ? <VideoMuteIllustration /> : null}
      {kind === "video" ? <VideoPlayerIllustration /> : null}
      {kind === "pdf" ? <PdfIllustration /> : null}
      {kind === "image" ? <ImageIllustration /> : null}
      {kind === "generic" ? <GenericToolIllustration /> : null}
    </div>
  );
}

const accent = "#5eead4";
const accentSoft = "rgba(94, 234, 212, 0.18)";
const panel = "#171717";
const panelEdge = "rgba(255,255,255,0.12)";
const inkMuted = "rgba(255,255,255,0.45)";
const screen = "#0a0a0a";

function VideoMuteIllustration() {
  return (
    <svg
      className="tool-overview-hero__svg"
      viewBox="0 0 280 220"
      role="img"
      focusable="false"
    >
      <title>Muted video player</title>
      {/* Soft backdrop wash */}
      <rect x="18" y="28" width="244" height="164" rx="22" fill={accentSoft} />
      {/* Player chrome */}
      <rect
        x="32"
        y="40"
        width="216"
        height="140"
        rx="16"
        fill={panel}
        stroke={panelEdge}
        strokeWidth="1.5"
      />
      {/* Screen */}
      <rect x="44" y="52" width="192" height="88" rx="10" fill={screen} />
      {/* Fake waveform / timeline preview bars */}
      <g opacity="0.55">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const h = 10 + ((i * 7) % 28);
          return (
            <rect
              key={i}
              x={56 + i * 14}
              y={96 - h / 2}
              width="7"
              height={h}
              rx="2"
              fill={i < 5 ? accent : inkMuted}
            />
          );
        })}
      </g>
      {/* Transport bar */}
      <rect x="44" y="148" width="192" height="20" rx="6" fill="rgba(0,0,0,0.35)" />
      <circle cx="56" cy="158" r="5" fill={accent} />
      <rect x="68" y="155" width="120" height="6" rx="3" fill="rgba(255,255,255,0.12)" />
      <rect x="68" y="155" width="48" height="6" rx="3" fill={accent} opacity="0.7" />
      {/* Mute badge */}
      <g transform="translate(168 64)">
        <circle cx="36" cy="36" r="28" fill="rgba(0,0,0,0.55)" stroke={accent} strokeWidth="1.5" />
        {/* Speaker */}
        <path
          d="M28 28 v16 h8 l12 10 V18 L36 28 Z"
          fill={accent}
          opacity="0.95"
        />
        {/* Cross-out */}
        <line
          x1="18"
          y1="18"
          x2="54"
          y2="54"
          stroke="#fafafa"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="18"
          y1="18"
          x2="54"
          y2="54"
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function VideoPlayerIllustration() {
  return (
    <svg
      className="tool-overview-hero__svg"
      viewBox="0 0 280 220"
      role="img"
      focusable="false"
    >
      <title>Video player</title>
      <rect x="18" y="28" width="244" height="164" rx="22" fill={accentSoft} />
      <rect
        x="32"
        y="40"
        width="216"
        height="140"
        rx="16"
        fill={panel}
        stroke={panelEdge}
        strokeWidth="1.5"
      />
      <rect x="44" y="52" width="192" height="100" rx="10" fill={screen} />
      <polygon points="128,78 128,126 168,102" fill={accent} opacity="0.9" />
      <rect x="44" y="160" width="192" height="8" rx="4" fill="rgba(255,255,255,0.1)" />
      <rect x="44" y="160" width="72" height="8" rx="4" fill={accent} opacity="0.75" />
    </svg>
  );
}

function PdfIllustration() {
  return (
    <svg
      className="tool-overview-hero__svg"
      viewBox="0 0 280 220"
      role="img"
      focusable="false"
    >
      <title>Document pages</title>
      <rect x="18" y="28" width="244" height="164" rx="22" fill={accentSoft} />
      <rect
        x="78"
        y="44"
        width="124"
        height="152"
        rx="10"
        fill={panel}
        stroke={panelEdge}
        strokeWidth="1.5"
      />
      <rect x="94" y="64" width="92" height="8" rx="4" fill={accent} opacity="0.85" />
      <rect x="94" y="84" width="92" height="6" rx="3" fill={inkMuted} />
      <rect x="94" y="98" width="72" height="6" rx="3" fill={inkMuted} />
      <rect x="94" y="112" width="92" height="6" rx="3" fill={inkMuted} />
      <rect x="94" y="126" width="56" height="6" rx="3" fill={inkMuted} />
      <rect x="94" y="152" width="48" height="20" rx="6" fill={accentSoft} stroke={accent} strokeWidth="1.25" />
    </svg>
  );
}

function ImageIllustration() {
  return (
    <svg
      className="tool-overview-hero__svg"
      viewBox="0 0 280 220"
      role="img"
      focusable="false"
    >
      <title>Image frame</title>
      <rect x="18" y="28" width="244" height="164" rx="22" fill={accentSoft} />
      <rect
        x="48"
        y="48"
        width="184"
        height="124"
        rx="14"
        fill={panel}
        stroke={panelEdge}
        strokeWidth="1.5"
      />
      <circle cx="88" cy="84" r="14" fill={accent} opacity="0.85" />
      <path
        d="M56 148 L108 104 L136 128 L168 96 L220 148 Z"
        fill={accent}
        opacity="0.35"
      />
      <path
        d="M56 148 L108 104 L136 128 L168 96 L220 148 Z"
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GenericToolIllustration() {
  return (
    <svg
      className="tool-overview-hero__svg"
      viewBox="0 0 280 220"
      role="img"
      focusable="false"
    >
      <title>Browser tool</title>
      <rect x="18" y="28" width="244" height="164" rx="22" fill={accentSoft} />
      <rect
        x="40"
        y="48"
        width="200"
        height="124"
        rx="14"
        fill={panel}
        stroke={panelEdge}
        strokeWidth="1.5"
      />
      <circle cx="58" cy="66" r="4" fill="#f87171" />
      <circle cx="72" cy="66" r="4" fill="#fbbf24" />
      <circle cx="86" cy="66" r="4" fill={accent} />
      <rect x="56" y="88" width="168" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
      <rect x="56" y="110" width="120" height="10" rx="5" fill="rgba(255,255,255,0.06)" />
      <rect x="56" y="138" width="88" height="18" rx="9" fill={accent} opacity="0.85" />
    </svg>
  );
}
