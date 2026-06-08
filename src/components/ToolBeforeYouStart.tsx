import type { ReactNode } from "react";

type ToolBeforeYouStartProps = {
  title: string;
  children: ReactNode;
};

/** Subtle glass panel — width controlled by tool page dashboard stack. */
export function ToolBeforeYouStart({ title, children }: ToolBeforeYouStartProps) {
  return (
    <>
      <h2 className="mb-3 font-sans text-xs font-semibold tracking-wide text-neutral-900 dark:text-white/80">
        {title}
      </h2>
      <div className="space-y-2 font-sans text-xs leading-relaxed tracking-wide text-neutral-700 dark:text-neutral-400 sm:text-sm">
        {children}
      </div>
    </>
  );
}
