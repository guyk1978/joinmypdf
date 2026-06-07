import type { ReactNode } from "react";

type ToolBeforeYouStartProps = {
  title: string;
  children: ReactNode;
};

/** Subtle glass footer note — aligned with the main tool upload stack. */
export function ToolBeforeYouStart({ title, children }: ToolBeforeYouStartProps) {
  return (
    <section className="tool-before-you-start mx-auto w-full max-w-2xl rounded-[16px] border border-black/[0.06] bg-black/[0.05] p-6 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.05]">
      <h2 className="mb-3 font-sans text-xs font-semibold tracking-wide text-neutral-600 dark:text-white/80">
        {title}
      </h2>
      <div className="space-y-2 font-sans text-xs leading-relaxed tracking-wide text-neutral-400 sm:text-sm">
        {children}
      </div>
    </section>
  );
}
