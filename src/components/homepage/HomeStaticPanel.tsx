import type { ReactNode } from "react";
import { clsx } from "clsx";
import { HomeSectionHeading } from "@/components/homepage/HomeSectionHeading";

type HomeStaticPanelProps = {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Extra class on the inner grid/list container. */
  bodyClassName?: string;
};

/**
 * Non-carousel homepage panel — heading + static body (grid/list/text).
 */
export function HomeStaticPanel({
  id,
  title,
  icon,
  children,
  className,
  bodyClassName,
}: HomeStaticPanelProps) {
  return (
    <section aria-labelledby={id} className={clsx("home-static-panel", className)}>
      <HomeSectionHeading id={id} icon={icon} className="home-static-panel__heading">
        {title}
      </HomeSectionHeading>
      <div className={clsx("home-static-panel__body", bodyClassName)}>{children}</div>
    </section>
  );
}
