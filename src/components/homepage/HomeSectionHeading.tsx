import type { ReactNode } from "react";
import { clsx } from "clsx";

type HomeSectionHeadingProps = {
  id: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

/**
 * Large, consistent H2 for every homepage content section.
 */
export function HomeSectionHeading({
  id,
  children,
  icon,
  className,
}: HomeSectionHeadingProps) {
  return (
    <h2 id={id} className={clsx("home-section__heading", className)}>
      {icon ? (
        <span className="home-section__heading-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="home-section__heading-text">{children}</span>
    </h2>
  );
}
