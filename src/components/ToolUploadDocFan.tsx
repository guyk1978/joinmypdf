/** Document fan behind the upload hero — pixel-matched to the Sign PDF mockup. */
export function ToolUploadDocFan() {
  return (
    <svg
      viewBox="0 0 300 148"
      className="tool-upload-zone__doc-fan"
      fill="none"
      aria-hidden
    >
      {/* back-right page with signature */}
      <g transform="translate(156 8) rotate(7)">
        <rect width="88" height="112" rx="8" fill="#2b3039" stroke="#3f4654" strokeWidth="1.2" />
        <line x1="16" y1="26" x2="72" y2="26" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        <line x1="16" y1="40" x2="66" y2="40" stroke="#525866" strokeWidth="3" strokeLinecap="round" />
        <line x1="16" y1="54" x2="58" y2="54" stroke="#525866" strokeWidth="3" strokeLinecap="round" />
        <line x1="16" y1="68" x2="50" y2="68" stroke="#454b57" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M20 88C34 80 48 84 62 76C70 71 76 73 82 68"
          stroke="#e5e7eb"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </g>

      {/* center page */}
      <g transform="translate(118 18) rotate(-1)">
        <rect width="76" height="100" rx="8" fill="#313742" stroke="#434a57" strokeWidth="1.2" />
        <line x1="14" y1="24" x2="62" y2="24" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="38" x2="56" y2="38" stroke="#525866" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="52" x2="48" y2="52" stroke="#525866" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M18 78C28 74 38 76 48 72"
          stroke="#d1d5db"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>

      {/* left small PDF */}
      <g transform="translate(42 52) rotate(-14)">
        <rect width="52" height="68" rx="7" fill="#353b46" stroke="#4b5260" strokeWidth="1.2" />
        <rect x="10" y="10" width="22" height="12" rx="2" fill="#eceff3" />
        <text x="21" y="19" textAnchor="middle" fill="#ef4444" fontSize="7.5" fontWeight="800" fontFamily="system-ui,sans-serif">
          PDF
        </text>
      </g>

      {/* left-back small PDF */}
      <g transform="translate(18 62) rotate(-20)">
        <rect width="46" height="58" rx="7" fill="#2d323c" stroke="#434a57" strokeWidth="1.2" opacity="0.9" />
        <rect x="9" y="9" width="20" height="11" rx="2" fill="#e7eaef" />
        <text x="19" y="17.5" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="800" fontFamily="system-ui,sans-serif">
          PDF
        </text>
      </g>
    </svg>
  );
}
