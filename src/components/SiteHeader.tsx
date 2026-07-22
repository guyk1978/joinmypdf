"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { SiteHeaderBar } from "@/components/SiteHeaderBar";

/** Enter compact mode once scroll passes this (px). */
const SCROLL_COMPACT_ENTER = 48;
/** Return to expanded only after scrolling back above this (px). */
const SCROLL_COMPACT_EXIT = 12;

const ROOT_COMPACT_CLASS = "site-header-is-compact";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const frameRef = useRef(0);

  useEffect(() => {
    const apply = (next: boolean) => {
      if (scrolledRef.current === next) return;
      scrolledRef.current = next;
      setScrolled(next);
      document.documentElement.classList.toggle(ROOT_COMPACT_CLASS, next);
    };

    const update = () => {
      frameRef.current = 0;
      const y = window.scrollY;
      if (scrolledRef.current) {
        if (y <= SCROLL_COMPACT_EXIT) apply(false);
      } else if (y >= SCROLL_COMPACT_ENTER) {
        apply(true);
      }
    };

    const onScroll = () => {
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      document.documentElement.classList.remove(ROOT_COMPACT_CLASS);
    };
  }, []);

  return (
    <header
      className={clsx(
        "site-header site-header--matte site-header--clean z-[120] w-full shrink-0",
        scrolled && "site-header--scrolled",
      )}
    >
      <div className="site-header__visual">
        <SiteHeaderBar />
      </div>
    </header>
  );
}
