import type { ReactNode } from "react";

type ToolBeforeYouStartProps = {
  title: string;
  children: ReactNode;
};

/** Subtle glass panel — width controlled by tool page dashboard stack. */
export function ToolBeforeYouStart({ title, children }: ToolBeforeYouStartProps) {
  return (
    <>
      <h2 className="mb-4 font-sans text-lg font-semibold tracking-wide text-white">{title}</h2>
      <div className="tool-before-you-start__body space-y-4 font-sans text-base leading-relaxed text-neutral-300">
        {children}
      </div>
    </>
  );
}
