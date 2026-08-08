"use client";

import { clsx } from "clsx";
import { ToolWhyPeopleUseIllustration } from "@/components/layout/ToolWhyPeopleUseIllustration";

type ToolWhyPeopleUseProps = {
  slug: string;
  heading: string;
  paragraphs: string[];
  className?: string;
};

/**
 * Full-width “Why People Use …” trust/conversion block —
 * story copy on the left, benefits illustration on the right.
 */
export function ToolWhyPeopleUse({
  slug,
  heading,
  paragraphs,
  className,
}: ToolWhyPeopleUseProps) {
  if (!paragraphs.length) return null;

  const headingId = "tool-story-why-heading";

  return (
    <article
      className={clsx("tool-why-hero", className)}
      aria-labelledby={headingId}
      data-tool-why="1"
    >
      <div className="tool-why-hero__grid">
        <div className="tool-why-hero__copy">
          <h2 id={headingId} className="tool-workspace-overview__title">
            {heading}
          </h2>
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 64)}
              className="tool-workspace-overview__text"
              dir="auto"
            >
              {paragraph}
            </p>
          ))}
        </div>
        <div className="tool-why-hero__visual">
          <ToolWhyPeopleUseIllustration slug={slug} />
        </div>
      </div>
    </article>
  );
}
