"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ReviewerAvatar } from "@/components/ReviewerAvatar";
import { ToolCreatorNote } from "@/components/layout/ToolCreatorNote";
import { ToolWhyPeopleUse } from "@/components/layout/ToolWhyPeopleUse";
import {
  buildToolPageStoryContent,
  DEFAULT_TOOL_PAGE_STORY_TEMPLATES_EN,
  type ToolPageStoryTemplates,
} from "@/lib/tool-page-story-sections";

type ToolPageStorySectionsProps = {
  slug: string;
  headline?: string | null;
  tagline?: string | null;
  subline?: string | null;
  /** Optional related-tools slot before FAQ / Reviews. */
  afterWhy?: ReactNode;
  /**
   * When false, skip the full-width creator note (parent already rendered it).
   * Default: true.
   */
  includeCreatorNote?: boolean;
};

function StarRating({
  rating,
  label,
}: {
  rating: number;
  label: string;
}) {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="tool-page-story__stars" aria-label={label}>
      {"★".repeat(clamped)}
      <span className="tool-page-story__stars-empty" aria-hidden>
        {"★".repeat(5 - clamped)}
      </span>
    </span>
  );
}

function readToolModalString(
  messages: ReturnType<typeof useMessages>,
  key: string,
  fallback: string,
): string {
  const toolModal = messages.ToolModal;
  if (!toolModal || typeof toolModal !== "object") return fallback;
  const value = (toolModal as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

/**
 * Tool-page story blocks below Overview:
 * Creator note → Why People Use (full-width) → FAQ | Reviews grid.
 */
export function ToolPageStorySections({
  slug,
  headline,
  tagline,
  subline,
  afterWhy,
  includeCreatorNote = true,
}: ToolPageStorySectionsProps) {
  const locale = useLocale();
  const messages = useMessages();
  const t = useTranslations("ToolModal");

  const templates = useMemo((): ToolPageStoryTemplates => {
    // Read raw catalog strings (keep `{toolName}` / `{task}` for fill later).
    // Avoid next-intl ICU here — it was silently falling back to English.
    const pick = (key: string, fallback: string) =>
      readToolModalString(messages, key, fallback);

    const en = DEFAULT_TOOL_PAGE_STORY_TEMPLATES_EN;
    return {
      whyHeading: pick("storyWhyHeading", en.whyHeading),
      whyWithTask: pick("storyWhyWithTask", en.whyWithTask),
      whyFallback: pick("storyWhyFallback", en.whyFallback),
      whyBrand: pick("storyWhyBrand", en.whyBrand),
      faqHeading: pick("storyFaqHeading", en.faqHeading),
      faqUseQ: pick("storyFaqUseQ", en.faqUseQ),
      faqUseA: pick("storyFaqUseA", en.faqUseA),
      faqPrepareQ: pick("storyFaqPrepareQ", en.faqPrepareQ),
      faqPrepareA: pick("storyFaqPrepareA", en.faqPrepareA),
      faqMobileQ: pick("storyFaqMobileQ", en.faqMobileQ),
      faqMobileA: pick("storyFaqMobileA", en.faqMobileA),
      faqLargeQ: pick("storyFaqLargeQ", en.faqLargeQ),
      faqLargeA: pick("storyFaqLargeA", en.faqLargeA),
      faqUndoQ: pick("storyFaqUndoQ", en.faqUndoQ),
      faqUndoA: pick("storyFaqUndoA", en.faqUndoA),
      faqAccountQ: pick("storyFaqAccountQ", en.faqAccountQ),
      faqAccountA: pick("storyFaqAccountA", en.faqAccountA),
      faqBrowsersQ: pick("storyFaqBrowsersQ", en.faqBrowsersQ),
      faqBrowsersA: pick("storyFaqBrowsersA", en.faqBrowsersA),
      storyHeading: pick("storyCreatorHeading", en.storyHeading),
      storyP1: pick("storyCreatorP1", en.storyP1),
      storyP2: pick("storyCreatorP2", en.storyP2),
      reviewsHeading: pick("storyReviewsHeading", en.reviewsHeading),
      reviewsIntro: pick("storyReviewsIntro", en.reviewsIntro),
    };
  }, [messages]);

  const content = useMemo(
    () =>
      buildToolPageStoryContent(slug, {
        headline,
        tagline,
        subline,
        locale,
        templates,
      }),
    [slug, headline, tagline, subline, locale, templates],
  );

  if (!content) return null;

  const faqId = "tool-story-faq-heading";
  const reviewsId = "tool-story-reviews-heading";

  return (
    <>
      {includeCreatorNote ? (
        <ToolCreatorNote
          heading={content.storyHeading}
          paragraphs={content.storyParagraphs}
        />
      ) : null}

      <ToolWhyPeopleUse
        slug={slug}
        heading={content.whyHeading}
        paragraphs={content.whyParagraphs}
      />

      <div className="tool-info-grid">
        {afterWhy}

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
          <p className="tool-page-story__text" dir="auto">
            {content.reviewsIntro}
          </p>
          {content.reviews.length ? (
            <ul className="tool-page-story__reviews">
              {content.reviews.map((review) => {
                const rating = Math.round(review.rating);
                let starsLabel = `${rating} out of 5 stars`;
                try {
                  if (t.has("storyStarsAria")) {
                    starsLabel = t("storyStarsAria", { rating });
                  }
                } catch {
                  // keep English aria fallback
                }
                return (
                  <li key={review.id} className="tool-page-story__review">
                    <div className="tool-page-story__review-head">
                      <div className="tool-page-story__review-identity">
                        <ReviewerAvatar
                          name={review.author}
                          className="tool-page-story__review-avatar"
                          size={40}
                        />
                        <span className="tool-page-story__review-author">
                          {review.author}
                        </span>
                      </div>
                      <StarRating rating={review.rating} label={starsLabel} />
                    </div>
                    <p className="tool-page-story__review-comment" dir="auto">
                      {review.comment}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </article>
      </div>
    </>
  );
}
