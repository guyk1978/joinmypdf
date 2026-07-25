"use client";

import { BookMarked, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { ToolSidebarBanner } from "@/components/ToolSidebarBanner";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroSplashActive } from "@/hooks/useToolIntroSplashActive";
import { usePathname } from "@/i18n/navigation";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";

/** Splash overlays sit at 999999 — the rails ride just above them. */
const RAIL_Z_INDEX = 1000000;

const FALLBACK = {
  imageCombiner: {
    ariaLabel: "Also try: Image Combiner",
    title: "Image Combiner",
    description:
      "Merge 2–4 photos side by side or stacked and download one clean PNG — nothing ever leaves your browser.",
    cta: "Open Image Combiner",
  },
  pdfReader: {
    ariaLabel: "Also try: PDF Reader Online",
    title: "PDF Reader Online",
    description:
      "Read and inspect any PDF with page navigation, zoom, and text selection — private, ad-free, and fully local.",
    cta: "Open PDF Reader",
  },
} as const;

type PromoKey = keyof typeof FALLBACK;

/** True when the landing on screen belongs to the promoted tool itself. */
function isOwnLanding(pathname: string, slug: string): boolean {
  return pathname
    .split("/")
    .filter(Boolean)
    .some((segment) => resolveCanonicalToolSlug(segment) === slug);
}

/**
 * Cross-promo rails for the empty columns flanking a tool landing's centre card.
 * Shown from the `md` breakpoint (768px+) so they still appear on laptops at
 * 125–150% browser zoom (CSS viewport shrinks under page zoom).
 * Each banner hides on its own tool's landing.
 */
export function ToolIntroSideBanners() {
  const t = useTranslations("ToolSidebarBanners");
  const introActive = useToolIntroSplashActive();
  const embed = useToolEmbedMode();
  const pathname = usePathname() || "/";

  if (!introActive || embed) return null;

  const showImageCombiner = !isOwnLanding(pathname, "image-combiner");
  const showPdfReader = !isOwnLanding(pathname, "pdf-reader");
  if (!showImageCombiner && !showPdfReader) return null;

  const text = (promo: PromoKey, key: keyof (typeof FALLBACK)[PromoKey]) => {
    const path = `${promo}.${key}`;
    return t.has(path) ? t(path) : FALLBACK[promo][key];
  };

  return createPortal(
    <div
      className={[
        "tool-intro-side-rails pointer-events-none fixed inset-0 hidden items-center",
        // md (768+) covers 1080p / 1366 laptops at 125–150% zoom.
        "md:grid md:grid-cols-[auto_minmax(0,1fr)_auto]",
        "gap-3 px-3 md:gap-4 md:px-4 lg:gap-6 lg:px-6 xl:gap-8 xl:px-8",
        // 1080p @ 150% zoom ≈ 720px CSS height — keep rails visible there.
        "[@media(max-height:520px)]:!hidden",
      ].join(" ")}
      style={{ zIndex: RAIL_Z_INDEX }}
    >
      <div className="pointer-events-auto flex justify-self-start">
        {showImageCombiner ? (
          <ToolSidebarBanner
            href="/tools/image-combiner/"
            icon={<Layers className="h-5 w-5 max-lg:h-4 max-lg:w-4" strokeWidth={1.75} />}
            ariaLabel={text("imageCombiner", "ariaLabel")}
            title={text("imageCombiner", "title")}
            description={text("imageCombiner", "description")}
            cta={text("imageCombiner", "cta")}
          />
        ) : null}
      </div>

      {/* Reserves the centre splash column so banners stay clear of the animation card. */}
      <div className="min-h-0 min-w-0" aria-hidden />

      <div className="pointer-events-auto flex justify-self-end">
        {showPdfReader ? (
          <ToolSidebarBanner
            href="/tools/pdf-reader/"
            icon={<BookMarked className="h-5 w-5 max-lg:h-4 max-lg:w-4" strokeWidth={1.75} />}
            ariaLabel={text("pdfReader", "ariaLabel")}
            title={text("pdfReader", "title")}
            description={text("pdfReader", "description")}
            cta={text("pdfReader", "cta")}
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
