"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.5M12 18.75v2.5M2.75 12h2.5M18.75 12h2.5M5.46 5.46l1.78 1.78M16.76 16.76l1.78 1.78M18.54 5.46l-1.78 1.78M7.24 16.76l-1.78 1.78"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M19 14.3A7.95 7.95 0 0 1 9.7 5a8.2 8.2 0 1 0 9.3 9.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className="h-10 w-10 rounded-xl border border-slate-200/70 bg-white/80" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-[#1C2541] dark:text-slate-200"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-200/60 to-cyan-100/40 opacity-100 transition-opacity duration-300 dark:from-blue-500/10 dark:to-indigo-400/10 dark:opacity-0" />
      <span className="relative">
        {isDark ? (
          <MoonIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
        ) : (
          <SunIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
        )}
      </span>
    </button>
  );
}
