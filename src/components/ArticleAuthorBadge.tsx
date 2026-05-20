import { resolveArticleAuthor } from "@/lib/article-author";
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
      className={`flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5 ${className}`}
      aria-label={`Written by ${author.name}, ${author.role}`}
    >
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatarUrl}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full border border-white/15 object-cover"
        />
      ) : (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand/10 text-xs font-semibold tracking-wide text-brand"
          aria-hidden
        >
          {author.initials}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug text-ink sm:text-sm">
          <span className="text-ink-muted">Written by </span>
          <span className="font-medium text-ink">{author.name}</span>
          <span className="text-ink-muted"> | {author.role}</span>
        </p>
        <p className="mt-0.5 flex items-start gap-1 text-[10px] leading-snug text-ink-muted sm:mt-1 sm:items-center sm:text-[11px]">
          <CheckBadgeIcon className="mt-px h-3 w-3 shrink-0 text-brand sm:mt-0 sm:h-3.5 sm:w-3.5" />
          <span>{author.verifiedLabel}</span>
        </p>
      </div>
    </aside>
  );
}
