import type { ReactNode } from "react";
import { clsx } from "clsx";
import { toolPageDashboardPanel } from "@/lib/tool-ui";

type ToolPageDashboardSectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
};

/** Flush glass panel — same width and styling across the tool page dashboard stack. */
export function ToolPageDashboardSection({
  children,
  className,
  id,
  "aria-labelledby": ariaLabelledby,
}: ToolPageDashboardSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={clsx(toolPageDashboardPanel, className)}
    >
      {children}
    </section>
  );
}
