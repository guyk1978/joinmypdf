"use client";

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Pause, Pin, Play, Scaling } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";
import { HomeSectionHeading } from "@/components/homepage/HomeSectionHeading";
import { HOME_SECTION_AUTOPLAY_MS } from "@/components/homepage/home-section";

type HomeSectionProps = {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Homepage content section: H2 + inline play/pause, 2×, and pin controls + snap carousel.
 * Pin uses position:fixed + a layout spacer so pinning works even if ancestors
 * had transforms/overflow that break position:sticky.
 */
export function HomeSection({ id, title, icon, children, className }: HomeSectionProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const isRtl = locale === "he";
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [largeCards, setLargeCards] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [spacerHeight, setSpacerHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const slides = Children.toArray(children).filter(Boolean);
  const showArrowControls = slides.length > 1;
  const showHeaderControls = slides.length > 0;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const measurePinnedHeight = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return 0;
    return Math.ceil(el.getBoundingClientRect().height);
  }, []);

  const toggleSticky = useCallback(() => {
    setSticky((wasSticky) => {
      if (wasSticky) {
        setSpacerHeight(0);
        return false;
      }
      const height = measurePinnedHeight();
      setSpacerHeight(height || sectionRef.current?.offsetHeight || 0);
      return true;
    });
  }, [measurePinnedHeight]);

  useLayoutEffect(() => {
    if (!sticky) return;
    const height = measurePinnedHeight();
    if (height > 0) setSpacerHeight(height);
  }, [sticky, largeCards, slides.length, measurePinnedHeight]);

  useEffect(() => {
    if (!sticky) return;
    const onResize = () => {
      const height = measurePinnedHeight();
      if (height > 0) setSpacerHeight(height);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [sticky, measurePinnedHeight]);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const epsilon = 4;

    if (maxScroll <= epsilon) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }

    const left = Math.abs(scrollLeft);
    const atStart = left <= epsilon;
    const atEnd = left >= maxScroll - epsilon;

    if (isRtl) {
      setCanPrev(!atEnd);
      setCanNext(!atStart);
    } else {
      setCanPrev(!atStart);
      setCanNext(!atEnd);
    }
  }, [isRtl]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateScrollState())
        : null;
    ro?.observe(track);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      ro?.disconnect();
    };
  }, [updateScrollState, slides.length, largeCards, sticky]);

  const getStepAmount = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const slide = track.querySelector<HTMLElement>(".home-section-carousel__slide");
    const styles = track.ownerDocument.defaultView?.getComputedStyle(track);
    const gap = Number.parseFloat(styles?.columnGap || styles?.gap || "12") || 12;
    return (slide?.offsetWidth ?? Math.min(264, track.clientWidth * 0.8)) + gap;
  }, []);

  const scrollByDir = useCallback(
    (direction: "prev" | "next", behavior: ScrollBehavior = "smooth") => {
      const track = trackRef.current;
      if (!track) return;

      const amount = getStepAmount();
      if (!amount) return;
      const sign = direction === "next" ? 1 : -1;
      const delta = sign * amount * (isRtl ? -1 : 1);
      track.scrollBy({ left: delta, behavior });
    },
    [getStepAmount, isRtl],
  );

  const scrollToStart = useCallback((behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: 0, behavior });
  }, []);

  const pauseAutoplay = useCallback(() => setAutoplay(false), []);

  useEffect(() => {
    if (!autoplay || reduceMotion || !showArrowControls) return;

    const tick = () => {
      const track = trackRef.current;
      if (!track) return;

      const { scrollLeft, scrollWidth, clientWidth } = track;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      const epsilon = 4;
      if (maxScroll <= epsilon) return;

      const left = Math.abs(scrollLeft);
      const atStart = left <= epsilon;
      const atEnd = left >= maxScroll - epsilon;
      const canAdvance = isRtl ? !atStart : !atEnd;

      if (!canAdvance) {
        scrollToStart("smooth");
        return;
      }

      scrollByDir("next", "smooth");
    };

    const timerId = window.setInterval(tick, HOME_SECTION_AUTOPLAY_MS);
    return () => window.clearInterval(timerId);
  }, [
    autoplay,
    reduceMotion,
    showArrowControls,
    isRtl,
    scrollByDir,
    scrollToStart,
  ]);

  useEffect(() => {
    if (reduceMotion && autoplay) setAutoplay(false);
  }, [reduceMotion, autoplay]);

  if (!slides.length) return null;

  const sectionNode = (
    <section
      ref={sectionRef}
      aria-labelledby={id}
      data-pinned={sticky ? "true" : undefined}
      className={clsx(
        "home-section",
        sticky && "home-section--pinned",
        className,
      )}
    >
      <div className="home-section__header-row">
        <HomeSectionHeading id={id} icon={icon} className="home-section__heading--inline">
          {title}
        </HomeSectionHeading>

        {showHeaderControls ? (
          <div className="home-section__header-controls">
            {!reduceMotion && showArrowControls ? (
              <button
                type="button"
                className={clsx(
                  "home-section__control",
                  autoplay && "home-section__control--active",
                )}
                aria-pressed={autoplay}
                aria-label={
                  autoplay ? t("landing.carouselPause") : t("landing.carouselPlay")
                }
                title={autoplay ? t("landing.carouselPause") : t("landing.carouselPlay")}
                onClick={() => setAutoplay((value) => !value)}
              >
                {autoplay ? (
                  <Pause size={16} strokeWidth={2.25} aria-hidden />
                ) : (
                  <Play size={16} strokeWidth={2.25} aria-hidden />
                )}
              </button>
            ) : null}

            <button
              type="button"
              className={clsx(
                "home-section__control",
                largeCards && "home-section__control--active",
              )}
              aria-pressed={largeCards}
              aria-label={
                largeCards
                  ? t("landing.carouselSizeShrink")
                  : t("landing.carouselSizeExpand")
              }
              title={
                largeCards
                  ? t("landing.carouselSizeShrink")
                  : t("landing.carouselSizeExpand")
              }
              onClick={() => setLargeCards((value) => !value)}
            >
              <Scaling size={16} strokeWidth={2.25} aria-hidden />
              <span className="home-section__control-label" aria-hidden>
                2×
              </span>
            </button>

            <button
              type="button"
              className={clsx(
                "home-section__control",
                sticky && "home-section__control--active",
              )}
              aria-pressed={sticky}
              aria-label={
                sticky ? t("landing.carouselStickyOff") : t("landing.carouselStickyOn")
              }
              title={
                sticky ? t("landing.carouselStickyOff") : t("landing.carouselStickyOn")
              }
              onClick={toggleSticky}
            >
              <Pin size={16} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={clsx(
          "home-section-carousel",
          largeCards && "home-section-carousel--large",
        )}
      >
        {showArrowControls ? (
          <div className="home-section-carousel__controls">
            <button
              type="button"
              className="home-section-carousel__nav home-section-carousel__nav--prev"
              onClick={() => {
                pauseAutoplay();
                scrollByDir("prev");
              }}
              disabled={!canPrev}
              aria-label={t("landing.carouselPrev")}
            >
              {isRtl ? (
                <ChevronRight size={18} strokeWidth={2} />
              ) : (
                <ChevronLeft size={18} strokeWidth={2} />
              )}
            </button>
            <button
              type="button"
              className="home-section-carousel__nav home-section-carousel__nav--next"
              onClick={() => {
                pauseAutoplay();
                scrollByDir("next");
              }}
              disabled={!canNext}
              aria-label={t("landing.carouselNext")}
            >
              {isRtl ? (
                <ChevronLeft size={18} strokeWidth={2} />
              ) : (
                <ChevronRight size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        ) : null}

        <div
          ref={trackRef}
          className="home-section-carousel__track"
          role="region"
          aria-label={title}
          aria-roledescription="carousel"
          tabIndex={0}
          onPointerDown={pauseAutoplay}
          onWheel={pauseAutoplay}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              pauseAutoplay();
            }
          }}
        >
          {slides.map((child, index) => (
            <div
              key={
                isValidElement(child) && child.key != null ? String(child.key) : index
              }
              className="home-section-carousel__slide"
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <>
      {sticky && spacerHeight > 0 ? (
        <div
          className="home-section__pin-spacer"
          style={{ height: spacerHeight }}
          aria-hidden
        />
      ) : null}

      {sticky && portalReady
        ? createPortal(sectionNode, document.body)
        : sectionNode}
    </>
  );
}
