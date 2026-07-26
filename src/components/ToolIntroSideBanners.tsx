"use client";

import { BookMarked, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ToolSidebarBanner } from "@/components/ToolSidebarBanner";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroSplashActive } from "@/hooks/useToolIntroSplashActive";
import { usePathname } from "@/i18n/navigation";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";

/** Splash overlays sit at 999999 — the rails ride just above them. */
const RAIL_Z_INDEX = 1000000;
const SPLASH_MIN = 480;
const HEIGHT_HIDE = 520;

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
type RailMode = "both" | "one" | "none";

function bannerWidthForViewport(width: number): number {
  if (width >= 1536) return 250;
  if (width >= 1280) return 210;
  if (width >= 1024) return 188;
  return 150;
}

function gapForViewport(width: number): number {
  if (width >= 1280) return 64;
  if (width >= 1024) return 48;
  return 32;
}

/** Measure free CSS width and pick both / one / no rails. */
function measureRailMode(): RailMode {
  if (typeof window === "undefined") return "none";
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (h <= HEIGHT_HIDE || w < 768) return "none";

  const bannerW = bannerWidthForViewport(w);
  const gap = gapForViewport(w);
  const pad = 32;
  const needBoth = 2 * bannerW + SPLASH_MIN + gap * 2 + pad;
  const needOne = bannerW + SPLASH_MIN + gap + pad;

  if (w >= Math.max(1200, needBoth)) return "both";
  if (w >= needOne) return "one";
  return "none";
}

/** True when the landing on screen belongs to the promoted tool itself. */
function isOwnLanding(pathname: string, slug: string): boolean {
  return pathname
    .split("/")
    .filter(Boolean)
    .some((segment) => resolveCanonicalToolSlug(segment) === slug);
}

/**
 * Cross-promo rails flanking a tool landing splash.
 * Progressive reveal by measured free width (not breakpoints alone):
 * both ≥~1200 CSS px · one rail intermediate · none when center would be cramped.
 */
export function ToolIntroSideBanners() {
  const t = useTranslations("ToolSidebarBanners");
  const introActive = useToolIntroSplashActive();
  const embed = useToolEmbedMode();
  const pathname = usePathname() || "/";
  const [railMode, setRailMode] = useState<RailMode>("none");

  useEffect(() => {
    const sync = () => setRailMode(measureRailMode());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  if (!introActive || embed || railMode === "none") return null;

  const showImageCombiner = !isOwnLanding(pathname, "image-combiner");
  const showPdfReader = !isOwnLanding(pathname, "pdf-reader");
  if (!showImageCombiner && !showPdfReader) return null;

  const text = (promo: PromoKey, key: keyof (typeof FALLBACK)[PromoKey]) => {
    const path = `${promo}.${key}`;
    return t.has(path) ? t(path) : FALLBACK[promo][key];
  };

  // One-rail mode: prefer PDF Reader; otherwise Image Combiner.
  let left: PromoKey | null = null;
  let right: PromoKey | null = null;

  if (railMode === "both") {
    left = showImageCombiner ? "imageCombiner" : null;
    right = showPdfReader ? "pdfReader" : null;
  } else if (showPdfReader) {
    right = "pdfReader";
  } else if (showImageCombiner) {
    left = "imageCombiner";
  }

  if (!left && !right) return null;

  return createPortal(
    <div
      className={[
        "tool-intro-side-rails pointer-events-none fixed inset-0 grid items-center",
        "grid-cols-[auto_minmax(0,1fr)_auto]",
        "gap-3 px-3 md:gap-4 md:px-4 lg:gap-6 lg:px-6 xl:gap-8 xl:px-8",
      ].join(" ")}
      style={{ zIndex: RAIL_Z_INDEX }}
      data-rail-mode={railMode}
    >
      <div className="pointer-events-auto flex justify-self-start">
        {left === "imageCombiner" ? (
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

      <div className="min-h-0 min-w-0" aria-hidden />

      <div className="pointer-events-auto flex justify-self-end">
        {right === "pdfReader" ? (
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
