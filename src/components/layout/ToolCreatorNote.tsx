"use client";

import { clsx } from "clsx";

type ToolCreatorNoteProps = {
  heading: string;
  paragraphs: string[];
  className?: string;
};

/**
 * Full-width personal “Note from the Creator” trust block —
 * story copy + portrait, paired under the Overview hero.
 */
export function ToolCreatorNote({
  heading,
  paragraphs,
  className,
}: ToolCreatorNoteProps) {
  if (!paragraphs.length) return null;

  const headingId = "tool-story-creator-heading";

  return (
    <article
      className={clsx("tool-creator-note", className)}
      aria-labelledby={headingId}
      data-tool-creator-note="1"
    >
      <div className="tool-creator-note__grid">
        <div className="tool-creator-note__portrait">
          <figure className="tool-creator-note__frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/creator-portrait.png"
              alt="Illustration of a developer building JoinMyPDF tools"
              className="tool-creator-note__image"
              width={900}
              height={1200}
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
        <div className="tool-creator-note__copy">
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
      </div>
    </article>
  );
}
