import { getToolsInventoryEntry } from "@/data/tools-inventory";

type ToolWhyPeopleUseIllustrationProps = {
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

const accent = "#5eead4";
const accentDeep = "#2dd4bf";
const panel = "#0f172a";
const panelEdge = "rgba(255,255,255,0.14)";
const soft = "rgba(94, 234, 212, 0.16)";
const ink = "#e2e8f0";
const muted = "rgba(226,232,240,0.55)";

/** Benefits-scene illustration for the Why People Use hero — static, tool-aware. */
export function ToolWhyPeopleUseIllustration({
  slug,
  className,
}: ToolWhyPeopleUseIllustrationProps) {
  const kind = resolveIllustrationKind(slug);

  return (
    <div className={className} aria-hidden="true">
      <svg
        className="tool-why-hero__svg"
        viewBox="0 0 320 260"
        role="img"
        focusable="false"
      >
        <title>Why people use this tool</title>
        <rect x="8" y="12" width="304" height="236" rx="22" fill={soft} />
        <rect
          x="22"
          y="26"
          width="276"
          height="208"
          rx="18"
          fill={panel}
          stroke={panelEdge}
          strokeWidth="1.5"
        />

        {/* Floating benefit chips */}
        <g transform="translate(40 44)">
          <rect width="86" height="28" rx="14" fill="rgba(16,185,129,0.18)" stroke="#34d399" strokeWidth="1.2" />
          <path d="M16 10 h8 v8 h-8 z M20 8 v12" stroke="#34d399" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="14" r="7" fill="none" stroke="#34d399" strokeWidth="1.4" />
          <path d="M17 14 l2 2 4-4" stroke="#34d399" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <text x="34" y="18" fill={ink} fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">
            privacy
          </text>
        </g>

        <g transform="translate(194 48)">
          <rect width="78" height="28" rx="14" fill="rgba(56,189,248,0.16)" stroke="#38bdf8" strokeWidth="1.2" />
          <path d="M16 20 a8 8 0 1 1 0.1 0" fill="none" stroke="#38bdf8" strokeWidth="1.6" />
          <path d="M16 20 L20 12" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
          <text x="30" y="18" fill={ink} fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">
            speed
          </text>
        </g>

        <g transform="translate(48 188)">
          <rect width="92" height="28" rx="14" fill="rgba(94,234,212,0.14)" stroke={accent} strokeWidth="1.2" />
          <path
            d="M18 10 c6-4 12-4 12 2 c0 6-6 10-12 14 c-6-4-12-8-12-14 c0-6 6-6 12-2"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
          />
          <path d="M18 12 v8 M14 16 h8" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
          <text x="36" y="18" fill={ink} fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">
            no upload
          </text>
        </g>

        {/* Small people / file accents */}
        <g opacity="0.9">
          <circle cx="58" cy="118" r="10" fill="#334155" />
          <path d="M48 136 c2-10 18-10 20 0" fill="#475569" />
          <rect x="72" y="108" width="18" height="22" rx="3" fill="#1e293b" stroke={muted} strokeWidth="1" />
          <path d="M72 114 h18" stroke={muted} strokeWidth="1" />

          <circle cx="262" cy="168" r="9" fill="#334155" />
          <path d="M252 184 c2-9 16-9 18 0" fill="#475569" />
          <rect x="244" y="148" width="16" height="12" rx="2" fill="#0ea5e9" opacity="0.7" />
        </g>

        {/* Center motif — tool-aware */}
        {kind === "video-mute" ? <MuteToggleMotif /> : null}
        {kind === "video" ? <VideoMotif /> : null}
        {kind === "pdf" ? <PdfMotif /> : null}
        {kind === "image" ? <ImageMotif /> : null}
        {kind === "generic" ? <GenericMotif /> : null}
      </svg>
    </div>
  );
}

function MuteToggleMotif() {
  return (
    <g transform="translate(108 78)">
      <rect width="104" height="118" rx="16" fill="#020617" stroke={panelEdge} strokeWidth="1.5" />
      <rect x="14" y="16" width="76" height="44" rx="8" fill="#111827" />
      {/* Waveform muted */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={i}
          x={22 + i * 9}
          y={28 + ((i * 5) % 12)}
          width="5"
          height={18 - ((i * 5) % 12)}
          rx="1.5"
          fill={i < 3 ? accent : muted}
          opacity={i < 3 ? 0.9 : 0.45}
        />
      ))}
      {/* Mute badge */}
      <circle cx="78" cy="28" r="11" fill="rgba(0,0,0,0.55)" stroke={accent} strokeWidth="1.2" />
      <path d="M74 24 v8 h4 l5 4 V20 l-5 4 Z" fill={accent} />
      <line x1="72" y1="22" x2="86" y2="34" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
      {/* Toggle + hand */}
      <rect x="22" y="74" width="60" height="26" rx="13" fill="#134e4a" stroke={accentDeep} strokeWidth="1.4" />
      <circle cx="66" cy="87" r="10" fill={accent} />
      <path
        d="M78 96 c6 4 14 10 18 18 c2 4-2 8-6 6 c-4-2-10-8-14-14 z"
        fill="#fbbf24"
        opacity="0.95"
      />
      <path d="M74 92 c4 2 8 6 10 10" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function VideoMotif() {
  return (
    <g transform="translate(108 86)">
      <rect width="104" height="100" rx="16" fill="#020617" stroke={panelEdge} strokeWidth="1.5" />
      <rect x="14" y="16" width="76" height="48" rx="8" fill="#111827" />
      <polygon points="44,30 44,52 64,41" fill={accent} />
      <rect x="14" y="74" width="76" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
      <rect x="14" y="74" width="34" height="10" rx="5" fill={accent} opacity="0.8" />
    </g>
  );
}

function PdfMotif() {
  return (
    <g transform="translate(118 72)">
      <rect width="84" height="116" rx="12" fill="#020617" stroke={panelEdge} strokeWidth="1.5" />
      <rect x="14" y="18" width="56" height="8" rx="4" fill={accent} opacity="0.85" />
      <rect x="14" y="36" width="56" height="6" rx="3" fill={muted} />
      <rect x="14" y="50" width="44" height="6" rx="3" fill={muted} />
      <rect x="14" y="64" width="56" height="6" rx="3" fill={muted} />
      <rect x="14" y="88" width="36" height="16" rx="6" fill={soft} stroke={accent} strokeWidth="1.2" />
    </g>
  );
}

function ImageMotif() {
  return (
    <g transform="translate(108 84)">
      <rect width="104" height="100" rx="16" fill="#020617" stroke={panelEdge} strokeWidth="1.5" />
      <circle cx="40" cy="44" r="10" fill={accent} opacity="0.85" />
      <path d="M18 88 L42 56 L58 72 L74 52 L98 88 Z" fill={accent} opacity="0.3" />
      <path
        d="M18 88 L42 56 L58 72 L74 52 L98 88 Z"
        fill="none"
        stroke={accent}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </g>
  );
}

function GenericMotif() {
  return (
    <g transform="translate(108 86)">
      <rect width="104" height="100" rx="16" fill="#020617" stroke={panelEdge} strokeWidth="1.5" />
      <circle cx="28" cy="28" r="4" fill="#f87171" />
      <circle cx="42" cy="28" r="4" fill="#fbbf24" />
      <circle cx="56" cy="28" r="4" fill={accent} />
      <rect x="18" y="46" width="68" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
      <rect x="18" y="64" width="48" height="10" rx="5" fill="rgba(255,255,255,0.06)" />
      <rect x="18" y="82" width="40" height="14" rx="7" fill={accent} opacity="0.85" />
    </g>
  );
}
