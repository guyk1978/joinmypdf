import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";

type HomeSectionBarProps = {
  id: string;
  title: string;
  href?: string;
  ctaLabel?: string;
  as?: "h2" | "h3";
  className?: string;
};

/**
 * Minimal text-only section separator — bold heading + optional muted View All.
 */
export function HomeSectionBar({
  id,
  title,
  href,
  ctaLabel,
  as: TitleTag = "h2",
  className,
}: HomeSectionBarProps) {
  return (
    <div className={clsx("home-section-bar", className)}>
      <TitleTag id={id} className="home-section-bar__title">
        {title}
      </TitleTag>
      {href && ctaLabel ? (
        <Link href={href} className="home-section-bar__all" prefetch={false}>
          {ctaLabel}
          <ArrowRight className="home-section-bar__all-icon" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
