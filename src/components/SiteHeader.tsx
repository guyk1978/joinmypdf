"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { SiteHeaderBar } from "@/components/SiteHeaderBar";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className={clsx(
        "site-header site-header--matte site-header--clean z-[120] w-full shrink-0 overflow-visible",
        scrolled && "site-header--scrolled",
      )}
    >
      <SiteHeaderBar />
    </header>
  );
}
