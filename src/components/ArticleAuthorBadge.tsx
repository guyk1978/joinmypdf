import { resolveArticleAuthor } from "@/lib/article-author";
import { clsx } from "clsx";
import type { BlogPost } from "@/lib/types";

type Props = {
  post?: Pick<BlogPost, "author"> | null;
  className?: string;
};

function CheckBadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5.25 8 7 9.75 10.75 6.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArticleAuthorBadge({ post, className = "" }: Props) {
  const author = resolveArticleAuthor(post);

  return (
    <aside
      className={clsx("article-author-badge", className)}
      aria-label={`Written by ${author.name}, ${author.role}`}
    >
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatarUrl}
          alt=""
          width={40}
          height={40}
          className="article-author-badge__avatar"
        />
      ) : (
        <span className="article-author-badge__initials" aria-hidden>
          {author.initials}
        </span>
      )}

      <div className="article-author-badge__copy">
        <p className="article-author-badge__name">
          <span className="article-author-badge__label">Written by </span>
          {author.name}
          <span className="article-author-badge__role"> · {author.role}</span>
        </p>
        <p className="article-author-badge__verified">
          <CheckBadgeIcon className="article-author-badge__verified-icon" />
          <span>{author.verifiedLabel}</span>
        </p>
      </div>
    </aside>
  );
}
