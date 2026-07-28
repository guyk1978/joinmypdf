"use client";

import { FormEvent, useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, MessageSquarePlus, Send } from "lucide-react";
import { clsx } from "clsx";
import { Link } from "@/i18n/navigation";
import { StarRating } from "@/components/StarRating";
import {
  REVIEW_LIMITS,
  SITE_REVIEW_SLUG,
  formatWebsiteDisplay,
  resolveReviewToolTitle,
  validateReviewDraft,
  type ReviewValidationError,
} from "@/data/community-reviews";
import { TOOLS_INVENTORY } from "@/data/tools-inventory";
import { useCommunityReviews } from "@/hooks/useCommunityReviews";
import { imBtnCta } from "@/lib/design-system";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import "./community-reviews.css";

type CommunityReviewsProps = {
  /** Scope submissions + feed to this tool (per-tool REVIEWS tab). */
  toolSlug?: string;
  /** Optional display title for the scoped tool. */
  toolTitle?: string;
  /**
   * `tool` — local feed for one tool (no source badges).
   * `global` — aggregator with “Reviewed on” attribution + tool links.
   */
  mode?: "tool" | "global";
  /** Compact layout for the library drawer panel. */
  compact?: boolean;
  className?: string;
};

function formatReviewDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

export function CommunityReviews({
  toolSlug,
  toolTitle,
  mode,
  compact = false,
  className,
}: CommunityReviewsProps) {
  const resolvedMode = mode ?? (toolSlug ? "tool" : "global");
  const t = useTranslations("Reviews");
  const tTools = useTranslations("Tools");
  const locale = useLocale();
  const baseId = useId();
  const { reviews, addReview, hydrated } = useCommunityReviews({
    toolSlug: resolvedMode === "tool" ? toolSlug : undefined,
    locale,
    toolTitle,
  });

  const toolOptions = useMemo(() => {
    return [...TOOLS_INVENTORY]
      .map((entry) => ({
        slug: entry.id,
        title: translateToolItem(tTools, entry.id, entry.title),
      }))
      .sort((a, b) => a.title.localeCompare(b.title, locale));
  }, [locale, tTools]);

  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedToolSlug, setSelectedToolSlug] = useState(toolSlug ?? "");
  const [error, setError] = useState<ReviewValidationError | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const scopedToolTitle =
    toolTitle ??
    (toolSlug ? resolveReviewToolTitle(toolSlug) : undefined);

  const errorMessage =
    error === "author_required"
      ? t("errors.authorRequired")
      : error === "rating_required"
        ? t("errors.ratingRequired")
        : error === "comment_required"
          ? t("errors.commentRequired")
          : error === "website_invalid"
            ? t("errors.websiteInvalid")
            : error === "tool_required"
              ? t("errors.toolRequired")
              : null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(false);

    const draftToolSlug =
      resolvedMode === "tool"
        ? toolSlug || SITE_REVIEW_SLUG
        : selectedToolSlug || SITE_REVIEW_SLUG;

    const validated = validateReviewDraft({
      author,
      rating,
      comment,
      websiteUrl,
      toolSlug: draftToolSlug,
    });
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    addReview(validated.data);
    setAuthor("");
    setRating(0);
    setComment("");
    setWebsiteUrl("");
    if (resolvedMode === "global") setSelectedToolSlug("");
    setError(null);
    setSubmitted(true);
  };

  const formSubtitle =
    resolvedMode === "tool" && scopedToolTitle
      ? t("formSubtitleTool", { tool: scopedToolTitle })
      : t("formSubtitle");

  const feedTitle =
    resolvedMode === "tool" && scopedToolTitle
      ? t("feedTitleTool", { tool: scopedToolTitle })
      : t("feedTitle");

  return (
    <div
      className={clsx(
        "community-reviews",
        compact && "community-reviews--compact",
        resolvedMode === "global" && "community-reviews--global",
        className,
      )}
    >
      <section
        className="community-reviews__submit"
        aria-labelledby={`${baseId}-form-title`}
      >
        <div className="community-reviews__submit-head">
          <MessageSquarePlus
            className="community-reviews__submit-icon"
            size={compact ? 16 : 18}
            strokeWidth={1.75}
            aria-hidden
          />
          <div>
            <h3 id={`${baseId}-form-title`} className="community-reviews__submit-title">
              {t("formTitle")}
            </h3>
            {!compact ? (
              <p className="community-reviews__submit-subtitle">{formSubtitle}</p>
            ) : null}
          </div>
        </div>

        {submitted ? (
          <p className="community-reviews__thanks" role="status">
            {t("thanks")}
          </p>
        ) : null}

        <form className="community-reviews__form" onSubmit={onSubmit} noValidate>
          {resolvedMode === "global" ? (
            <div className="community-reviews__field">
              <label className="community-reviews__label" htmlFor={`${baseId}-tool`}>
                {t("toolLabel")}
                <span className="community-reviews__optional">{t("optional")}</span>
              </label>
              <select
                id={`${baseId}-tool`}
                name="toolSlug"
                className="community-reviews__input community-reviews__select"
                value={selectedToolSlug}
                onChange={(event) => setSelectedToolSlug(event.target.value)}
              >
                <option value="">{t("toolPlaceholder")}</option>
                {toolOptions.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.title}
                  </option>
                ))}
              </select>
              <p className="community-reviews__hint">{t("toolHint")}</p>
            </div>
          ) : null}

          <div className="community-reviews__field">
            <label className="community-reviews__label" htmlFor={`${baseId}-author`}>
              {t("nameLabel")}
            </label>
            <input
              id={`${baseId}-author`}
              name="author"
              type="text"
              required
              maxLength={REVIEW_LIMITS.authorMax}
              autoComplete="nickname"
              className="community-reviews__input"
              placeholder={t("namePlaceholder")}
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
            />
          </div>

          <div className="community-reviews__field">
            <span className="community-reviews__label" id={`${baseId}-rating-label`}>
              {t("ratingLabel")}
            </span>
            <StarRating
              value={rating}
              onChange={setRating}
              size={compact ? "md" : "lg"}
              label={t("ratingLabel")}
              color="#fafafa"
              className="community-reviews__stars"
            />
          </div>

          <div className="community-reviews__field">
            <label className="community-reviews__label" htmlFor={`${baseId}-comment`}>
              {t("commentLabel")}
            </label>
            <textarea
              id={`${baseId}-comment`}
              name="comment"
              required
              rows={compact ? 3 : 4}
              maxLength={REVIEW_LIMITS.commentMax}
              className="community-reviews__input community-reviews__textarea"
              placeholder={t("commentPlaceholder")}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </div>

          <div className="community-reviews__field">
            <label className="community-reviews__label" htmlFor={`${baseId}-website`}>
              {t("websiteLabel")}
              <span className="community-reviews__optional">{t("optional")}</span>
            </label>
            <input
              id={`${baseId}-website`}
              name="websiteUrl"
              type="text"
              inputMode="url"
              maxLength={REVIEW_LIMITS.websiteMax}
              autoComplete="url"
              className="community-reviews__input"
              placeholder={t("websitePlaceholder")}
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
            />
            <p className="community-reviews__hint">{t("websiteHint")}</p>
          </div>

          {errorMessage ? (
            <p className="community-reviews__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" className={clsx(imBtnCta, "community-reviews__submit-btn")}>
            <Send size={15} strokeWidth={2} aria-hidden />
            <span>{t("submit")}</span>
          </button>
        </form>
      </section>

      <section
        className="community-reviews__feed"
        aria-labelledby={`${baseId}-feed-title`}
      >
        <div className="community-reviews__feed-head">
          <h3 id={`${baseId}-feed-title`} className="community-reviews__feed-title">
            {feedTitle}
          </h3>
          {hydrated ? (
            <p className="community-reviews__feed-count">
              {t("feedCount", { count: reviews.length })}
            </p>
          ) : null}
        </div>

        {!hydrated ? (
          <p className="community-reviews__loading">{t("loading")}</p>
        ) : (
          <ul className="community-reviews__list">
            {reviews.map((review) => (
              <li key={review.id} className="community-reviews__item">
                <div className="community-reviews__item-top">
                  <div className="community-reviews__author-block">
                    <p className="community-reviews__author">{review.author}</p>
                    {review.websiteUrl ? (
                      <a
                        href={review.websiteUrl}
                        className="community-reviews__website"
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                      >
                        <ExternalLink size={12} strokeWidth={2} aria-hidden />
                        <span>{formatWebsiteDisplay(review.websiteUrl)}</span>
                      </a>
                    ) : null}
                  </div>
                  <time
                    className="community-reviews__date"
                    dateTime={review.createdAt}
                  >
                    {formatReviewDate(review.createdAt, locale)}
                  </time>
                </div>
                <StarRating
                  value={review.rating}
                  readOnly
                  size="sm"
                  color="#fafafa"
                  className="community-reviews__item-stars"
                />
                <p className="community-reviews__comment">{review.comment}</p>
                {resolvedMode === "global" ? (
                  <p className="community-reviews__source">
                    <span className="community-reviews__source-label">
                      {t("reviewedOn")}
                    </span>
                    <Link
                      href={review.toolHref}
                      className="community-reviews__source-link"
                      prefetch={false}
                    >
                      {review.toolTitle}
                    </Link>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
