"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { ToolCardGrid } from "@/components/ToolCardGrid";
import { PaginatedToolCardGrid } from "@/components/PaginatedToolCardGrid";
import { ToolListIcon } from "@/components/ToolListIcon";

type HomeFeaturedToolCardProps = {
  href: string;
  label: string;
  slugHint: string;
};

export function HomeFeaturedToolCard({ href, label, slugHint }: HomeFeaturedToolCardProps) {
  return (
    <ToolCard
      href={href}
      label={label}
      icon={<ToolListIcon slug={slugHint} label={label} />}
    />
  );
}

type HomeFeaturedSectionProps = {
  id: string;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  children: ReactNode;
  className?: string;
  hideTitle?: boolean;
  /** Compact dashboard layout — visible section header + inline view-all link. */
  variant?: "default" | "dashboard";
  /** Limit visible cards with a "Show more" control (default: on). Pass false to show all at once. */
  paginate?: boolean;
};

export function HomeFeaturedSection({
  id,
  title,
  viewAllHref,
  viewAllLabel,
  children,
  className,
  hideTitle = false,
  variant = "default",
  paginate,
}: HomeFeaturedSectionProps) {
  const isDashboard = variant === "dashboard";
  const usePagination = paginate !== false;
  const gridClassName = isDashboard ? "tool-card-grid--dashboard" : undefined;
  const gridContent = usePagination ? (
    <PaginatedToolCardGrid className={gridClassName}>{children}</PaginatedToolCardGrid>
  ) : (
    <ToolCardGrid className={clsx("tool-card-grid--stretch", gridClassName)}>{children}</ToolCardGrid>
  );

  return (
    <section
      className={clsx("home-minimal-section", isDashboard && "home-minimal-section--dashboard", className)}
      aria-labelledby={id}
    >
      {isDashboard ? (
        <div className="home-minimal-section__header">
          <h2 id={id} className="home-minimal-section__title home-minimal-section__title--dashboard">
            {title}
          </h2>
          <Link
            href={viewAllHref}
            className="home-minimal-section__link home-minimal-section__link--header"
            prefetch={false}
          >
            {viewAllLabel}
            <ArrowRight className="home-minimal-section__link-icon" aria-hidden />
          </Link>
        </div>
      ) : (
        <h2 id={id} className={hideTitle ? "sr-only" : "home-minimal-section__title"}>
          {title}
        </h2>
      )}
      {gridContent}
      {!isDashboard ? (
        <p className="home-minimal-section__footer">
          <Link href={viewAllHref} className="home-minimal-section__link" prefetch={false}>
            {viewAllLabel}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
