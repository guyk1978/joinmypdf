"use client";

import { useId } from "react";

/**
 * Cinematic large-scale N-Up grid motion for the fullscreen intro splash.
 * Four cells breathe into a unified sheet — dark blues / whites only.
 */
export function NUpPdfIntroMotion() {
  const uid = useId().replace(/:/g, "");
  const glow = `nup-cine-glow-${uid}`;
  const soft = `nup-cine-soft-${uid}`;
  const fill = `nup-cine-fill-${uid}`;

  return (
    <div className="nup-cinematic__motion" aria-hidden>
      <svg
        className="nup-cinematic__canvas"
        viewBox="0 0 480 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={fill} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#0a1628" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={soft} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="240" cy="240" r="210" fill={`url(#${fill})`} />

        {/* Outer sheet frame */}
        <rect
          className="nup-cinematic__frame"
          x="88"
          y="88"
          width="304"
          height="304"
          rx="10"
          filter={`url(#${glow})`}
        />

        {/* Cross guides */}
        <line className="nup-cinematic__guide" x1="240" y1="96" x2="240" y2="384" />
        <line className="nup-cinematic__guide" x1="96" y1="240" x2="384" y2="240" />

        {/* Four cells */}
        <g filter={`url(#${soft})`}>
          <rect className="nup-cinematic__cell nup-cinematic__cell--1" x="108" y="108" width="118" height="118" rx="6" />
          <rect className="nup-cinematic__cell nup-cinematic__cell--2" x="254" y="108" width="118" height="118" rx="6" />
          <rect className="nup-cinematic__cell nup-cinematic__cell--3" x="108" y="254" width="118" height="118" rx="6" />
          <rect className="nup-cinematic__cell nup-cinematic__cell--4" x="254" y="254" width="118" height="118" rx="6" />
        </g>

        {/* Inner line details */}
        <g className="nup-cinematic__lines" opacity="0.45">
          <path d="M128 140h78M128 158h58M128 176h70" />
          <path d="M274 140h78M274 158h58M274 176h70" />
          <path d="M128 286h78M128 304h58M128 322h70" />
          <path d="M274 286h78M274 304h58M274 322h70" />
        </g>

        {/* Soft orbiting particle ring */}
        <circle className="nup-cinematic__orbit" cx="240" cy="240" r="168" />
        <circle className="nup-cinematic__dot nup-cinematic__dot--a" cx="240" cy="72" r="2.5" fill="#93c5fd" />
        <circle className="nup-cinematic__dot nup-cinematic__dot--b" cx="408" cy="240" r="2" fill="#e2e8f0" />
        <circle className="nup-cinematic__dot nup-cinematic__dot--c" cx="240" cy="408" r="2.2" fill="#60a5fa" />
      </svg>
    </div>
  );
}
