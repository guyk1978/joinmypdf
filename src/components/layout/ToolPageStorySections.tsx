"use client";

import { useMemo } from "react";
import { FaqAccordion } from "@/components/FaqAccordion";
import { buildToolPageStoryContent } from "@/lib/tool-page-story-sections";

type ToolPageStorySectionsProps = {
  slug: string;
  headline?: string | null;
  tagline?: string | null;
  subline?: string | null;
};

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="tool-page-story__stars" aria-label={`${clamped} out of 5 stars`}>
      {"★".repeat(clamped)}
      <span className="tool-page-story__stars-empty" aria-hidden>
        {"★".repeat(5 - clamped)}
      </span>
    </span>
  );
}

/**
 * Standardized English sections below Overview on every tool page:
 * Why People Use, FAQ (usage-focused), Creator note, and Reviews.
 */
export function ToolPageStorySections({
  slug,
  headline,
  tagline,
  subline,
}: ToolPageStorySectionsProps) {
  const content = useMemo(
    () => buildToolPageStoryContent(slug, { headline, tagline, subline }),
    [slug, headline, tagline, subline],
  );

  if (!content) return null;

  const whyId = "tool-story-why-heading";
  const faqId = "tool-story-faq-heading";
  const storyId = "tool-story-creator-heading";
  const reviewsId = "tool-story-reviews-heading";

  return (
    <div className="tool-page-story" data-tool-story-sections="1">
      <section className="tool-page-story__section" aria-labelledby={whyId}>
        <h2 id={whyId} className="tool-page-story__title">
          {content.whyHeading}
        </h2>
        {content.whyParagraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 64)} className="tool-page-story__text">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="tool-page-story__section" aria-labelledby={faqId}>
        <h2 id={faqId} className="tool-page-story__title">
          {content.faqHeading}
        </h2>
        <FaqAccordion items={content.faqs} />
      </section>

      <section className="tool-page-story__section tool-page-story__section--note" aria-labelledby={storyId}>
        <h2 id={storyId} className="tool-page-story__title">
          {content.storyHeading}
        </h2>
        {content.storyParagraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 64)} className="tool-page-story__text">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="tool-page-story__section" aria-labelledby={reviewsId}>
        <h2 id={reviewsId} className="tool-page-story__title">
          {content.reviewsHeading}
        </h2>
        <p className="tool-page-story__text">{content.reviewsIntro}</p>
        {content.reviews.length ? (
          <ul className="tool-page-story__reviews">
            {content.reviews.map((review) => (
              <li key={review.id} className="tool-page-story__review">
                <div className="tool-page-story__review-head">
                  <span className="tool-page-story__review-author">{review.author}</span>
                  <StarRating rating={review.rating} />
                </div>
                <p className="tool-page-story__review-comment">{review.comment}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
