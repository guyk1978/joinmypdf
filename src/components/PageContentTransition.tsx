"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import type { ReactNode } from "react";

/** circOut — snappy deceleration for enter */
const ENTER_EASE = [0, 0.55, 0.45, 1] as const;

const enterTransition = {
  duration: 0.4,
  ease: ENTER_EASE,
};

const exitTransition = {
  duration: 0.2,
  ease: "easeIn" as const,
};

type PageContentTransitionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * SPA-style page transitions on main content only (header/footer stay static).
 * AnimatePresence coordinates exit → enter; initial={false} preserves first-paint LCP.
 */
export function PageContentTransition({ children, className }: PageContentTransitionProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={clsx("page-content-transition--main", className)}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className={clsx("page-content-transition--main", className)}
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1, transition: enterTransition }}
        exit={{ opacity: 0, scale: 0.98, transition: exitTransition }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
