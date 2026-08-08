/** Cute animated JoinMyPDF mascot for the global header brand. */
export function HeaderPdfMini({ className = "" }: { className?: string }) {
  return (
    <span
      className={["header-pdf-mini", "header-pdf-mascot", className]
        .filter(Boolean)
        .join(" ")}
      title="JoinMyPDF"
      aria-hidden="true"
    >
      <svg
        className="header-pdf-mascot__svg"
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft glow / wing wash */}
        <ellipse
          className="header-pdf-mascot__glow"
          cx="20"
          cy="22"
          rx="16"
          ry="12"
          fill="currentColor"
          fillOpacity="0.16"
        />
        <path
          className="header-pdf-mascot__wing header-pdf-mascot__wing--left"
          d="M6 20c2.5-4 6-6 9-5.5-2.2 1.8-3.4 4.2-3.8 7.2C9.2 21 7.2 20.6 6 20Z"
          fill="currentColor"
          fillOpacity="0.28"
        />
        <path
          className="header-pdf-mascot__wing header-pdf-mascot__wing--right"
          d="M34 20c-2.5-4-6-6-9-5.5 2.2 1.8 3.4 4.2 3.8 7.2 2-1.2 4-1.6 5.2-1.7Z"
          fill="currentColor"
          fillOpacity="0.28"
        />

        {/* Body + bob group */}
        <g className="header-pdf-mascot__bob">
          {/* Antenna */}
          <g className="header-pdf-mascot__antenna">
            <line
              x1="20"
              y1="5.5"
              x2="20"
              y2="8.2"
              stroke="#e2e8f0"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <circle
              className="header-pdf-mascot__antenna-dot"
              cx="20"
              cy="4.4"
              r="1.55"
              fill="currentColor"
            />
          </g>

          {/* Head */}
          <rect
            x="10.5"
            y="8"
            width="19"
            height="16.5"
            rx="8.2"
            fill="#f8fafc"
          />
          {/* Ear buds */}
          <rect x="8.4" y="13.2" width="2.6" height="5.2" rx="1.3" fill="#e2e8f0" />
          <rect x="29" y="13.2" width="2.6" height="5.2" rx="1.3" fill="#e2e8f0" />

          {/* Face screen */}
          <rect x="13.2" y="11.4" width="13.6" height="10" rx="4.2" fill="#0f172a" />

          {/* Eyes */}
          <g className="header-pdf-mascot__eyes">
            <ellipse
              className="header-pdf-mascot__eye"
              cx="17.4"
              cy="16"
              rx="2.15"
              ry="2.35"
              fill="#f8fafc"
            />
            <ellipse
              className="header-pdf-mascot__eye"
              cx="22.6"
              cy="16"
              rx="2.15"
              ry="2.35"
              fill="#f8fafc"
            />
            <circle
              className="header-pdf-mascot__sparkle"
              cx="16.7"
              cy="15.2"
              r="0.7"
              fill="#0f172a"
            />
            <circle
              className="header-pdf-mascot__sparkle"
              cx="21.9"
              cy="15.2"
              r="0.7"
              fill="#0f172a"
            />
            <circle cx="18" cy="16.7" r="0.35" fill="#0f172a" fillOpacity="0.35" />
            <circle cx="23.2" cy="16.7" r="0.35" fill="#0f172a" fillOpacity="0.35" />
          </g>

          {/* Smile */}
          <path
            className="header-pdf-mascot__smile"
            d="M17.6 19.2c.7.7 1.7 1.05 2.4 1.05s1.7-.35 2.4-1.05"
            stroke="#f8fafc"
            strokeWidth="1.15"
            strokeLinecap="round"
            fill="none"
          />

          {/* Torso */}
          <path
            d="M14.5 24.2h11c1.4 0 2.5 1.1 2.5 2.4v3.2c0 1.8-1.7 3.2-3.7 3.2h-8.6c-2 0-3.7-1.4-3.7-3.2v-3.2c0-1.3 1.1-2.4 2.5-2.4Z"
            fill="#f1f5f9"
          />
          <circle cx="20" cy="27.4" r="1.1" fill="currentColor" fillOpacity="0.85" />

          {/* Held PDF page */}
          <g className="header-pdf-mascot__page">
            <rect
              x="22.8"
              y="24.6"
              width="8.4"
              height="10.2"
              rx="1.4"
              fill="#ecfeff"
              stroke="currentColor"
              strokeWidth="1.1"
            />
            <rect x="24.4" y="27" width="5.2" height="1.15" rx="0.5" fill="currentColor" fillOpacity="0.55" />
            <rect x="24.4" y="29.2" width="3.8" height="1.15" rx="0.5" fill="currentColor" fillOpacity="0.35" />
            <rect x="24.4" y="31.4" width="4.5" height="1.15" rx="0.5" fill="currentColor" fillOpacity="0.28" />
          </g>

          {/* Tiny stack trail */}
          <g className="header-pdf-mascot__stack" opacity="0.9">
            <rect x="31.2" y="18.5" width="4.2" height="5.2" rx="0.7" fill="currentColor" fillOpacity="0.22" />
            <rect x="32" y="17.2" width="4.2" height="5.2" rx="0.7" fill="currentColor" fillOpacity="0.38" />
            <rect x="32.8" y="15.9" width="4.2" height="5.2" rx="0.7" fill="currentColor" fillOpacity="0.55" />
          </g>
        </g>
      </svg>
    </span>
  );
}
