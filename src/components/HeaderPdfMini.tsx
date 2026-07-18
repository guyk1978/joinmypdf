/** Bold animated merging-documents icon for the global header brand. */
export function HeaderPdfMini({ className = "" }: { className?: string }) {
  return (
    <span
      className={["header-pdf-mini text-neutral-50", className].filter(Boolean).join(" ")}
      title="JoinMyPDF Factory"
      aria-hidden="true"
    >
      <svg width="28" height="28" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Diagonal blue -> green -> red brand gradient, soft-blended for dark UI. */}
          <linearGradient
            id="hpm-brand-gradient"
            x1="0"
            y1="0"
            x2="16"
            y2="16"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="0.5" stopColor="#22c55e" />
            <stop offset="1" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <rect
          className="header-pdf-mini__back"
          x="2"
          y="4"
          width="9"
          height="11"
          rx="0"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="url(#hpm-brand-gradient)"
          fillOpacity="0.45"
        />
        <rect
          className="header-pdf-mini__front"
          x="5"
          y="1"
          width="9"
          height="11"
          rx="0"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="url(#hpm-brand-gradient)"
          fillOpacity="0.7"
        />
      </svg>
    </span>
  );
}
