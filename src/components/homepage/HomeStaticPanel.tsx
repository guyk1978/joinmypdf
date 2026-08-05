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
  /** Optional toolbar rendered under the heading (e.g. batch actions). */
  toolbar?: ReactNode;
};

/**
 * Non-carousel homepage panel — heading + optional toolbar + static body.
 */
export function HomeStaticPanel({
  id,
  title,
  icon,
  children,
  className,
  bodyClassName,
  toolbar,
}: HomeStaticPanelProps) {
  return (
    <section aria-labelledby={id} className={clsx("home-static-panel", className)}>
      <HomeSectionHeading id={id} icon={icon} className="home-static-panel__heading">
        {title}
      </HomeSectionHeading>
      {toolbar ? <div className="home-static-panel__toolbar">{toolbar}</div> : null}
      <div className={clsx("home-static-panel__body", bodyClassName)}>{children}</div>
    </section>
  );
}
