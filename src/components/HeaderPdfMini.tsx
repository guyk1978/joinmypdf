/** Mini animated merging-documents icon for the global header brand. */
export function HeaderPdfMini({ className = "" }: { className?: string }) {
  return (
    <span
      className={["header-pdf-mini", className].filter(Boolean).join(" ")}
      title="JoinMyPDF Factory"
      aria-hidden="true"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          className="header-pdf-mini__back"
          x="2"
          y="4"
          width="9"
          height="11"
          rx="1"
          stroke="#60a5fa"
          strokeWidth="1.2"
          fill="rgba(96, 165, 250, 0.1)"
        />
        <rect
          className="header-pdf-mini__front"
          x="5"
          y="1"
          width="9"
          height="11"
          rx="1"
          stroke="#3b82f6"
          strokeWidth="1.2"
          fill="rgba(59, 130, 246, 0.2)"
        />
      </svg>
    </span>
  );
}
