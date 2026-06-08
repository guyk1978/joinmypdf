/** Minimal decorative sword between homepage hero copy and mascot image. */
export function HomeHeroSword({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M16 4 L16 78"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M8 78 H24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 78 V96"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 78 V96"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="100" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M11 8 L21 8 L16 18 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 18 L18 18 L16 26 Z"
        fill="currentColor"
        fillOpacity="0.35"
      />
    </svg>
  );
}
