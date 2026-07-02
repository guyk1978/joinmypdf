"use client";

import { usePageTransition } from "@/context/PageTransitionContext";
import { usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

/** circOut — smooth deceleration for enter */
const ENTER_EASE = [0, 0.55, 0.45, 1] as const;

const EXIT_TRANSITION = {
  duration: 0.2,
  ease: "easeIn" as const,
};

const ENTER_TRANSITION = {
  duration: 0.3,
  ease: ENTER_EASE,
};

type PageContentTransitionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Sequential fade: exit current content → navigate → enter new content.
 * Driven by PageTransitionProvider (navigation is deferred until exit completes).
 */
export function PageContentTransition({ children, className }: PageContentTransitionProps) {
  const pathname = usePathname() || "/";
  const { phase, onExitAnimationComplete, onEnterAnimationComplete } = usePageTransition();
  const reduceMotion = useReducedMotion();
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  if (reduceMotion) {
    return <div className={clsx("page-content-transition--main", className)}>{children}</div>;
  }

  const isExiting = phase === "exiting";
  const isEntering = phase === "entering";

  return (
    <motion.div
      key={pathname}
      className={clsx("page-content-transition--main", className, isExiting && "page-content-transition--exiting")}
      initial={isEntering ? { opacity: 0 } : false}
      animate={
        isExiting
          ? { opacity: 0, transition: EXIT_TRANSITION }
          : { opacity: 1, transition: isEntering ? ENTER_TRANSITION : { duration: 0 } }
      }
      onAnimationComplete={() => {
        if (phaseRef.current === "exiting") onExitAnimationComplete();
        if (phaseRef.current === "entering") onEnterAnimationComplete();
      }}
    >
      {children}
    </motion.div>
  );
}
