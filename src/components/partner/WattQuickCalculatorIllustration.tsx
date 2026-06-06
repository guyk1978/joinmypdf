/** Animated financial calculator + bar chart for WattQuick partner banner. */
export function WattQuickCalculatorIllustration() {
  return (
    <div className="animate-wattquick-float pointer-events-none select-none" aria-hidden="true">
      <svg viewBox="0 0 220 200" className="h-44 w-full max-w-[220px] sm:h-48" role="img">
        <title>Financial calculator illustration</title>

        {/* Ambient glow pulses */}
        <circle cx="110" cy="100" r="72" className="fill-neutral-400/20 animate-pulse" />
        <circle cx="168" cy="52" r="18" className="fill-neutral-400/25 animate-pulse [animation-delay:400ms]" />
        <circle cx="48" cy="140" r="14" className="fill-neutral-500/20 animate-pulse [animation-delay:700ms]" />

        {/* Bar chart */}
        <g transform="translate(52, 18)">
          <rect x="0" y="28" width="22" height="34" rx="4" className="fill-neutral-500/20 animate-pulse" />
          <rect x="30" y="14" width="22" height="48" rx="4" className="fill-neutral-400/20 animate-pulse [animation-delay:150ms]" />
          <rect x="60" y="22" width="22" height="40" rx="4" className="fill-neutral-400/25 animate-pulse [animation-delay:300ms]" />
          <path
            d="M0 66 H82"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-pulse [animation-delay:500ms]"
          />
        </g>

        {/* Calculator body */}
        <g transform="translate(44, 78)">
          <rect x="0" y="0" width="132" height="108" rx="14" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
          <rect x="10" y="10" width="112" height="26" rx="6" fill="#0a0a0a" />
          <text x="114" y="28" textAnchor="end" fill="#4ade80" fontSize="14" fontWeight="700" fontFamily="ui-monospace, monospace">
            $12,450
          </text>

          {/* Keypad */}
          {[
            { x: 10, y: 46, fill: "#3b82f6", pulse: true },
            { x: 48, y: 46, fill: "#3b82f6", pulse: false },
            { x: 86, y: 46, fill: "#3b82f6", pulse: true },
            { x: 10, y: 68, fill: "#22c55e", pulse: false },
            { x: 48, y: 68, fill: "#22c55e", pulse: true },
            { x: 86, y: 68, fill: "#22c55e", pulse: false },
            { x: 10, y: 90, fill: "#f59e0b", pulse: true },
            { x: 48, y: 90, fill: "#f59e0b", pulse: false },
            { x: 86, y: 90, fill: "#fbbf24", pulse: true },
          ].map((key, i) => (
            <rect
              key={i}
              x={key.x}
              y={key.y}
              width="30"
              height="18"
              rx="5"
              fill={key.fill}
              className={key.pulse ? "animate-pulse" : undefined}
              style={key.pulse ? { animationDelay: `${i * 120}ms` } : undefined}
            />
          ))}
        </g>

        {/* Spark lines */}
        <path
          d="M24 120 L36 108 L48 114"
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="animate-pulse"
        />
        <path
          d="M178 130 L190 118 L202 124"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="animate-pulse [animation-delay:350ms]"
        />
      </svg>
    </div>
  );
}
