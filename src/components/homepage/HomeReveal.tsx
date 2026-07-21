"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const REVEAL_MARGIN_PX = 40;

/**
 * Fades a homepage section in the first time it enters the viewport.
 * Clears residual transforms after settle so sticky/fixed children can pin
 * to the viewport (transforms on ancestors create a containing block).
 */
export function HomeReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [settled, setSettled] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (reduceMotion) {
      setVisible(true);
      setSettled(true);
    }
  }, [reduceMotion]);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setVisible(true);
      setSettled(true);
      return;
    }

    let revealed = false;
    const show = () => {
      if (revealed) return;
      revealed = true;
      setVisible(true);
    };

    const check = () => {
      const rect = el.getBoundingClientRect();
      if (
        rect.top < window.innerHeight - REVEAL_MARGIN_PX &&
        rect.bottom > REVEAL_MARGIN_PX
      ) {
        show();
      }
    };

    check();
    if (revealed || typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) show();
      },
      { rootMargin: `-${REVEAL_MARGIN_PX}px` },
    );
    observer.observe(el);
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={visible ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onAnimationComplete={() => setSettled(true)}
      style={settled ? { transform: "none" } : undefined}
    >
      {children}
    </motion.div>
  );
}
