"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import "./pdf-reader-promo-banner.css";

type PdfReaderPromoBannerProps = {
  /** Optional class for placement tweaks (home vs category hubs). */
  className?: string;
};

const FALLBACK = {
  ariaLabel: "New tool: PDF Reader Online",
  eyebrow: "New launch",
  title: "PDF Reader Online",
  description: "Read and inspect PDFs peacefully in your browser — private, ad-free, and fully local.",
  cta: "Open PDF Reader",
} as const;

/** Launch banner linking to PDF Reader Online — width-matched to the site content grid. */
export function PdfReaderPromoBanner({ className }: PdfReaderPromoBannerProps) {
  const t = useTranslations("PdfReaderPromo");

  const text = (key: keyof typeof FALLBACK) =>
    t.has(key) ? t(key) : FALLBACK[key];

  return (
    <aside
      className={["pdf-reader-promo", className].filter(Boolean).join(" ")}
      aria-label={text("ariaLabel")}
    >
      <div className="pdf-reader-promo__surface">
        <div className="pdf-reader-promo__inner">
          <div className="pdf-reader-promo__copy">
            <p className="pdf-reader-promo__eyebrow">{text("eyebrow")}</p>
            <p className="pdf-reader-promo__title">{text("title")}</p>
            <p className="pdf-reader-promo__desc">{text("description")}</p>
          </div>
          <Link href="/tools/pdf-reader/" className="pdf-reader-promo__cta">
            {text("cta")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
