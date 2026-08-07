"use client";

import { useMemo, type ReactNode } from "react";
import { FaqAccordion } from "@/components/FaqAccordion";
import { buildToolPageStoryContent } from "@/lib/tool-page-story-sections";

type ToolPageStorySectionsProps = {
  slug: string;
  headline?: string | null;
  tagline?: string | null;
  subline?: string | null;
  /** Inserted after Why (Row 2 left: You Might Also Need). */
  afterWhy?: ReactNode;
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
 * Grid children for tool-page info cards (paired with Overview in `.tool-info-grid`):
 * Row1: Why | (Overview is sibling before this)
 * Row2: afterWhy (Related) + Creator note
 * Row3: FAQ + Reviews
 */
export function ToolPageStorySections({
  slug,
  headline,
  tagline,
  subline,
  afterWhy,
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
    <>
      <article className="tool-info-card tool-info-card--why" aria-labelledby={whyId}>
        <h2 id={whyId} className="tool-page-story__title">
          {content.whyHeading}
        </h2>
        {content.whyParagraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 64)} className="tool-page-story__text">
            {paragraph}
          </p>
        ))}
      </article>

      {afterWhy}

      <article className="tool-info-card tool-info-card--note" aria-labelledby={storyId}>
        <h2 id={storyId} className="tool-page-story__title">
          {content.storyHeading}
        </h2>
        {content.storyParagraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 64)} className="tool-page-story__text">
            {paragraph}
          </p>
        ))}
      </article>

      <article className="tool-info-card tool-info-card--faq" aria-labelledby={faqId}>
        <h2 id={faqId} className="tool-page-story__title">
          {content.faqHeading}
        </h2>
        <FaqAccordion items={content.faqs} />
      </article>

      <article className="tool-info-card tool-info-card--reviews" aria-labelledby={reviewsId}>
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
      </article>
    </>
  );
}
